import { expect } from 'chai';
import { ethers } from 'hardhat';
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers').constants;
describe('CreditToken', function () {
  it('should deploy', async function () {
    const CreditToken = await ethers.getContractFactory('CreditToken');
    const creditToken = await CreditToken.deploy('Credit', 'Credit');
    await creditToken.deployed();
    expect(await creditToken.name()).to.equal('Credit');
    expect(await creditToken.symbol()).to.equal('Credit');
  });
  it('should initialize', async function () {
    const CreditToken = await ethers.getContractFactory('CreditToken');
    const creditToken = await CreditToken.deploy('Credit', 'Credit');
    await creditToken.deployed();
    const [lendPool, underlying] = await ethers.getSigners();
    await creditToken.initialize(
      await lendPool.getAddress(),
      await underlying.getAddress(),
      ZERO_ADDRESS
    );
    expect(await creditToken.lendingPool()).to.equal(
      await lendPool.getAddress()
    );
    expect(await creditToken.UNDERLYING_ASSET_ADDRESS()).to.equal(
      await underlying.getAddress()
    );
  });
  it('should mint', async function () {
    const CreditToken = await ethers.getContractFactory('CreditToken');
    const creditToken = await CreditToken.deploy('Credit', 'Credit');
    await creditToken.deployed();
    const [lendPool, underlying, user] = await ethers.getSigners();
    await creditToken.initialize(
      await lendPool.getAddress(),
      await underlying.getAddress(),
      ZERO_ADDRESS
    );
    await creditToken.connect(lendPool).mint(await user.getAddress(), 100);
    expect(await creditToken.balanceOf(await user.getAddress())).to.equal(100);
    await expect(
      creditToken.connect(underlying).mint(await user.getAddress(), 100)
    ).to.be.revertedWith('Only lending pool can call this function');
  });
  it('should burn', async function () {
    const CreditToken = await ethers.getContractFactory('CreditToken');
    const creditToken = await CreditToken.deploy('Credit', 'Credit');
    await creditToken.deployed();
    const [lendPool, user] = await ethers.getSigners();
    const underlying = await (
      await ethers.getContractFactory('MintableErc20')
    ).deploy('Test', 'TST');
    await creditToken.initialize(
      await lendPool.getAddress(),
      underlying.address,
      ZERO_ADDRESS
    );
    await underlying.mint(user.address, 100);
    await underlying.connect(user).approve(creditToken.address, 100);
    await underlying.connect(user).transfer(creditToken.address, 100);
    await creditToken.connect(lendPool).mint(await user.getAddress(), 100);
    expect(await creditToken.balanceOf(await user.getAddress())).to.equal(100);
    await creditToken
      .connect(lendPool)
      .burn(await user.getAddress(), await user.getAddress(), 100);
    expect(await creditToken.balanceOf(await user.getAddress())).to.equal(0);
    await expect(
      creditToken
        .connect(user)
        .burn(await user.getAddress(), await user.getAddress(), 100)
    ).to.be.revertedWith('Only lending pool can call this function');
  });
  it('should lockFor', async function () {
    const CreditToken = await ethers.getContractFactory('CreditToken');
    const creditToken = await CreditToken.deploy('Credit', 'Credit');
    await creditToken.deployed();
    const [lendPool, user] = await ethers.getSigners();
    const underlying = await (
      await ethers.getContractFactory('MintableErc20')
    ).deploy('Test', 'TST');
    await creditToken.initialize(
      await lendPool.getAddress(),
      underlying.address,
      ZERO_ADDRESS
    );
    await underlying.mint(user.address, 100);
    await underlying.connect(user).approve(creditToken.address, 100);
    await underlying.connect(user).transfer(creditToken.address, 100);
    await creditToken.connect(lendPool).mint(await user.getAddress(), 100);
    expect(
      await creditToken.unlockedBalanceOf(await user.getAddress())
    ).to.equal(100);
    await creditToken
      .connect(lendPool)
      .lockFor(await user.getAddress(), 100, 1);
    expect(
      await creditToken.unlockedBalanceOf(await user.getAddress())
    ).to.equal(0);
  });
  it('should onLockCreated', async function () {
    const CreditToken = await ethers.getContractFactory('CreditToken');
    const creditToken = await CreditToken.deploy('Credit', 'Credit');
    await creditToken.deployed();
    const [lendPool, user] = await ethers.getSigners();
    const underlying = await (
      await ethers.getContractFactory('MintableErc20')
    ).deploy('Test', 'TST');
    await creditToken.initialize(
      await lendPool.getAddress(),
      underlying.address,
      await lendPool.getAddress()
    );
    await underlying.mint(user.address, 100);
    await underlying.connect(user).approve(creditToken.address, 100);
    await underlying.connect(user).transfer(creditToken.address, 100);
    await creditToken.connect(lendPool).mint(await user.getAddress(), 100);
    await creditToken
      .connect(lendPool)
      .lockFor(await user.getAddress(), 100, 1);
    expect(
      await creditToken.collateralAmountOf(await user.getAddress())
    ).to.equal(0);
    await creditToken
      .connect(lendPool)
      .onLockCreated(await user.getAddress(), 100, 2);
    expect(
      await creditToken.collateralAmountOf(await user.getAddress())
    ).to.equal(100);
  });
  it('should onLockReleased', async function () {
    const CreditToken = await ethers.getContractFactory('CreditToken');
    const creditToken = await CreditToken.deploy('Credit', 'Credit');
    await creditToken.deployed();
    const [lendPool, user] = await ethers.getSigners();
    const underlying = await (
      await ethers.getContractFactory('MintableErc20')
    ).deploy('Test', 'TST');
    await creditToken.initialize(
      await lendPool.getAddress(),
      underlying.address,
      await lendPool.getAddress()
    );
    await creditToken.onLockCreated(await user.getAddress(), 100, 1);
    expect(
      await creditToken.collateralAmountOf(await user.getAddress())
    ).to.equal(100);
    await creditToken.unlockFor(await user.getAddress(), 100, 1);
    expect(
      await creditToken.collateralAmountOf(await user.getAddress())
    ).to.equal(0);
  });
  it('should burn locked for', async () => {
    const CreditToken = await ethers.getContractFactory('CreditToken');
    const creditToken = await CreditToken.deploy('Credit', 'Credit');
    await creditToken.deployed();
    const [lendPool, user] = await ethers.getSigners();
    const underlying = await (
      await ethers.getContractFactory('MintableErc20')
    ).deploy('Test', 'TST');
    await creditToken.initialize(
      await lendPool.getAddress(),
      underlying.address,
      await lendPool.getAddress()
    );
    // mint 100
    await creditToken.mint(await user.getAddress(), 100);

    // lock
    await creditToken.lockFor(await user.getAddress(), 100, 1);
    expect(
      await creditToken.collateralAmountOf(await user.getAddress())
    ).to.equal(0);

    // burn
    await creditToken.burnLockedFor(
      await user.getAddress(),
      await user.getAddress(),
      100,
      1
    );
    expect(
      await creditToken.collateralAmountOf(await user.getAddress())
    ).to.equal(100);
  });
});
