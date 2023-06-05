import { expect } from 'chai';
import { ethers } from 'hardhat';
import { deployMockToken } from '../../scripts/contracts/helpers';
import { setup } from '../__setup/setup';
import { BigNumber } from 'ethers';
import { ONE_ETHER } from '../../scripts/contracts/utils';

describe('LendingPool', function () {
  it('should deploy', async function () {
    const LendingPool = await ethers.getContractFactory('LendingPool');
    const lendingPool = await LendingPool.deploy();
    await lendingPool.deployed();
  });
  it('should init reserve', async function () {
    const LendingPool = await ethers.getContractFactory('LendingPool');
    const lendingPool = await LendingPool.deploy();
    await lendingPool.deployed();
    const { creditToken, debtToken, mintableERC20 } = await deployMockToken(
      'TST',
      'Test'
    );
    await lendingPool.initReserve(
      mintableERC20.address,
      creditToken.address,
      debtToken.address
    );
    expect((await lendingPool.assetList(0)).underlying).to.equal(
      mintableERC20.address
    );
    expect((await lendingPool.assetList(0)).creditToken).to.equal(
      creditToken.address
    );
    expect((await lendingPool.assetList(0)).debtToken).to.equal(
      debtToken.address
    );
  });
  it('should deposit', async () => {
    const { lendingPool, tokens } = await setup();
    const [user] = await ethers.getSigners();
    const { mintableERC20, creditToken } = tokens[0];
    await mintableERC20.mint(await user.getAddress(), ONE_ETHER);
    await mintableERC20.approve(lendingPool.address, ONE_ETHER);
    await lendingPool.deposit(mintableERC20.address, ONE_ETHER);
    expect(await creditToken.balanceOf(await user.getAddress())).to.equal(
      ONE_ETHER
    );
  });
  it('should withdraw', async () => {
    const { lendingPool, tokens } = await setup();
    const [user] = await ethers.getSigners();
    const { mintableERC20 } = tokens[0];
    await mintableERC20.mint(await user.getAddress(), ONE_ETHER);
    await mintableERC20.approve(lendingPool.address, ONE_ETHER);
    await lendingPool.deposit(mintableERC20.address, ONE_ETHER);
    await lendingPool.withdraw(mintableERC20.address, ONE_ETHER);
    expect(await mintableERC20.balanceOf(await user.getAddress())).to.equal(
      ONE_ETHER
    );
  });
  it('should borrow', async () => {
    const { lendingPool, tokens } = await setup();
    const [user] = await ethers.getSigners();
    const { mintableERC20, debtToken } = tokens[0];
    await mintableERC20.mint(await user.getAddress(), ONE_ETHER);
    await mintableERC20.approve(lendingPool.address, ONE_ETHER);
    await lendingPool.deposit(mintableERC20.address, ONE_ETHER);
    const amt = ONE_ETHER.mul(8).div(10);
    await lendingPool.borrow(mintableERC20.address, amt);
    expect(await debtToken.balanceOf(await user.getAddress())).to.equal(amt);
    expect(await mintableERC20.balanceOf(await user.getAddress())).to.equal(
      amt
    );
  });
  it('should fail when borrow with undercollateral', async () => {
    const { lendingPool, tokens } = await setup();
    const [user] = await ethers.getSigners();
    const { mintableERC20 } = tokens[0];
    await mintableERC20.mint(await user.getAddress(), ONE_ETHER);
    await mintableERC20.approve(lendingPool.address, ONE_ETHER);
    await lendingPool.deposit(mintableERC20.address, ONE_ETHER);
    const amt = ONE_ETHER.mul(8).div(10).add(1);
    await expect(
      lendingPool.borrow(mintableERC20.address, amt)
    ).to.be.revertedWith('health factor too low');
  });
  it('should repay', async () => {
    const { lendingPool, tokens } = await setup();
    const [user] = await ethers.getSigners();
    const { mintableERC20, debtToken } = tokens[0];
    await mintableERC20.mint(await user.getAddress(), ONE_ETHER);
    await mintableERC20.approve(lendingPool.address, ONE_ETHER);
    await lendingPool.deposit(mintableERC20.address, ONE_ETHER);
    const amt = ONE_ETHER.mul(8).div(10);
    await lendingPool.borrow(mintableERC20.address, amt);
    await mintableERC20.approve(lendingPool.address, amt);
    await lendingPool.repay(mintableERC20.address, amt);
    expect(await debtToken.balanceOf(await user.getAddress())).to.equal(0);
    expect(await mintableERC20.balanceOf(await user.getAddress())).to.equal(0);
  });
  it('should liquidate', async () => {
    const { lendingPool, tokens, oracle } = await setup();

    const mockDAI = tokens[0].mintableERC20;
    const mockUSDC = tokens[1].mintableERC20;
    const mockUSDCCredit = tokens[1].creditToken;
    const mockUSDCDebt = tokens[1].debtToken;
    const [alice, bob] = await ethers.getSigners();
    // 1. alice deposits one etehr DAI and bob mints 50 ether USDC
    // 1.1 alice
    await mockDAI.mint(await alice.getAddress(), ONE_ETHER);
    await mockDAI.connect(alice).approve(lendingPool.address, ONE_ETHER);
    await lendingPool.connect(alice).deposit(mockDAI.address, ONE_ETHER);
    // 1.2 bob
    await mockUSDC.mint(await bob.getAddress(), ONE_ETHER.mul(100));
    await mockUSDC
      .connect(bob)
      .approve(lendingPool.address, ONE_ETHER.mul(100 / 2));
    await lendingPool
      .connect(bob)
      .deposit(mockUSDC.address, ONE_ETHER.mul(100 / 2));
    // 2. alice borrows 0.8 USDC
    const amt = ONE_ETHER.mul(8).div(10);
    await lendingPool.connect(alice).borrow(mockUSDC.address, amt);
    // 2.1 So the health factor of alice is 1 * 0.8 / 0.8 = 1
    expect(await lendingPool.healthFactorOf(await alice.getAddress())).to.equal(
      ONE_ETHER
    );
    // 3. Oracle price of DAI gets down to 0.8
    await oracle.setPrice(await mockDAI.symbol(), ONE_ETHER.mul(8).div(10));
    expect(await oracle.getPriceInUsd(await mockDAI.symbol())).to.equal(
      ONE_ETHER.mul(8).div(10)
    );
    // 3.1 So the health factor of alice is 1 * 0.8 * 0.8 / 0.8 = 0.8
    expect(await lendingPool.healthFactorOf(await alice.getAddress())).to.equal(
      ONE_ETHER.mul(8).div(10)
    );

    // 4. bob liquidate alice
    await mockUSDC
      .connect(bob)
      .approve(lendingPool.address, ONE_ETHER.mul(100));
    await lendingPool
      .connect(bob)
      .liquidationCall(
        mockDAI.address,
        mockUSDC.address,
        await alice.getAddress(),
        ONE_ETHER
      );
    // 5. alice's debt is 0.8 / 2 USDC
    expect(await mockUSDCDebt.balanceOf(await alice.getAddress())).to.equal(
      ONE_ETHER.mul(4).div(10)
    );
    // 6. bob's DAI is 0.8 / 2 / 0.8 = 0.5
    expect(await mockDAI.balanceOf(await bob.getAddress())).to.equal(
      ONE_ETHER.mul(5).div(10)
    );
    // 7. bob's USDC is 50 - 0.8 / 2 = 49.6
    expect(await mockUSDC.balanceOf(await bob.getAddress())).to.equal(
      ONE_ETHER.mul(496).div(10)
    );
    // 8. bob's USDC credit is 50
    expect(await mockUSDCCredit.balanceOf(await bob.getAddress())).to.equal(
      ONE_ETHER.mul(50)
    );
  });
  it('should liquidate other chain', async () => {
    const { lendingPool, tokens, oracle } = await setup();

    const mockDAI = tokens[0].mintableERC20;
    const mockUSDC = tokens[1].mintableERC20;
    const mockDAICredit = tokens[0].creditToken;
    const mockUSDCCredit = tokens[1].creditToken;
    const mockUSDCDebt = tokens[1].debtToken;
    const [alice, bob] = await ethers.getSigners();
    const SRC_CHAIN_ID = 1;
    // 1. alice unlocks one etehr DAI and bob mints 50 ether USDC
    // 1.1 alice
    await mockDAICredit.setChainsight(
      (await ethers.getSigners())[0].getAddress()
    );
    await mockDAICredit.onLockCreated(
      await alice.getAddress(),
      ONE_ETHER,
      SRC_CHAIN_ID
    );
    expect(
      await mockDAICredit.amountLockedFrom(
        await alice.getAddress(),
        SRC_CHAIN_ID
      )
    ).to.equal(ONE_ETHER);
    // 1.2 bob
    await mockUSDC.mint(await bob.getAddress(), ONE_ETHER.mul(100));
    await mockUSDC
      .connect(bob)
      .approve(lendingPool.address, ONE_ETHER.mul(100 / 2));
    await lendingPool
      .connect(bob)
      .deposit(mockUSDC.address, ONE_ETHER.mul(100 / 2));
    await mockDAI.mint(await bob.getAddress(), ONE_ETHER);
    await mockDAI.connect(bob).approve(lendingPool.address, ONE_ETHER);
    await lendingPool.connect(bob).deposit(mockDAI.address, ONE_ETHER);
    // 2. alice borrows 0.8 USDC
    const amt = ONE_ETHER.mul(8).div(10);
    await lendingPool.connect(alice).borrow(mockUSDC.address, amt);
    // 2.1 So the health factor of alice is 1 * 0.8 / 0.8 = 1
    expect(await lendingPool.healthFactorOf(await alice.getAddress())).to.equal(
      ONE_ETHER
    );
    // 3. Oracle price of DAI gets down to 0.8
    await oracle.setPrice(await mockDAI.symbol(), ONE_ETHER.mul(8).div(10));
    expect(await oracle.getPriceInUsd(await mockDAI.symbol())).to.equal(
      ONE_ETHER.mul(8).div(10)
    );
    // 3.1 So the health factor of alice is 1 * 0.8 * 0.8 / 0.8 = 0.8
    expect(await lendingPool.healthFactorOf(await alice.getAddress())).to.equal(
      ONE_ETHER.mul(8).div(10)
    );

    // 4. bob liquidate alice
    await mockUSDC
      .connect(bob)
      .approve(lendingPool.address, ONE_ETHER.mul(100));
    const tx = await lendingPool
      .connect(bob)
      .liquidationCall(
        mockDAI.address,
        mockUSDC.address,
        await alice.getAddress(),
        ONE_ETHER
      );

    const receipt = await tx.wait();
    const eventArgs = receipt.events?.find(
      (e: any) => e.event === 'LockReleased'
    )!.args!;
    expect(eventArgs.account).to.equal(await alice.getAddress());
    expect(eventArgs.asset).to.equal(mockDAI.address);
    expect(eventArgs.symbol).to.equal('TST0');
    expect(eventArgs.amount).to.equal(ONE_ETHER.div(2));
    expect(eventArgs.srcChainId).to.equal(SRC_CHAIN_ID);
    expect(eventArgs.to).to.equal(await bob.getAddress());

    // 5. alice's debt is 0.8 / 2 USDC
    expect(await mockUSDCDebt.balanceOf(await alice.getAddress())).to.equal(
      ONE_ETHER.mul(4).div(10)
    );
    // 6. bob's DAI is 0
    expect(await mockDAI.balanceOf(await bob.getAddress())).to.equal(0);
    // 7. bob's USDC is 50 - 0.8 / 2 = 49.6
    expect(await mockUSDC.balanceOf(await bob.getAddress())).to.equal(
      ONE_ETHER.mul(496).div(10)
    );
    // 8. bob's USDC credit is 50
    expect(await mockUSDCCredit.balanceOf(await bob.getAddress())).to.equal(
      ONE_ETHER.mul(50)
    );
  });
  it('should lockFor', async () => {
    const { lendingPool, tokens } = await setup();
    const token = tokens[0].mintableERC20;
    const creditToken = tokens[0].creditToken;
    const [alice] = await ethers.getSigners();
    await token.mint(await alice.getAddress(), ONE_ETHER);
    await token.connect(alice).approve(lendingPool.address, ONE_ETHER);
    await lendingPool.connect(alice).deposit(token.address, ONE_ETHER);
    await lendingPool.connect(alice).lockFor(token.address, ONE_ETHER, 1);
    expect(
      await creditToken.collateralAmountOf(await alice.getAddress())
    ).to.equal(0);
  });
});
