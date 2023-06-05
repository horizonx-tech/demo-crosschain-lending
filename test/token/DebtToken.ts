import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('DebtToken', function () {
  it('should deploy', async function () {
    const DebtToken = await ethers.getContractFactory('DebtToken');
    const debtToken = await DebtToken.deploy('Debt', 'Debt');
    await debtToken.deployed();
    expect(await debtToken.name()).to.equal('Debt');
    expect(await debtToken.symbol()).to.equal('Debt');
  });
  it('should initialize', async function () {
    const DebtToken = await ethers.getContractFactory('DebtToken');
    const debtToken = await DebtToken.deploy('Debt', 'Debt');
    await debtToken.deployed();
    const [lendPool, underlying] = await ethers.getSigners();
    await debtToken.initialize(
      await lendPool.getAddress(),
      await underlying.getAddress()
    );
    expect(await debtToken.lendingPool()).to.equal(await lendPool.getAddress());
    expect(await debtToken.UNDERLYING_ASSET_ADDRESS()).to.equal(
      await underlying.getAddress()
    );
  });
  it('should mint', async function () {
    const DebtToken = await ethers.getContractFactory('DebtToken');
    const debtToken = await DebtToken.deploy('Debt', 'Debt');
    await debtToken.deployed();
    const [lendPool, underlying, user] = await ethers.getSigners();
    await debtToken.initialize(
      await lendPool.getAddress(),
      await underlying.getAddress()
    );
    await debtToken.connect(lendPool).mint(await user.getAddress(), 100);
    expect(await debtToken.balanceOf(await user.getAddress())).to.equal(100);
    await expect(
      debtToken.connect(underlying).mint(await user.getAddress(), 100)
    ).to.be.revertedWith('Only lending pool can call this function');
  });
  it('should burn', async function () {
    const DebtToken = await ethers.getContractFactory('DebtToken');
    const debtToken = await DebtToken.deploy('Debt', 'Debt');
    await debtToken.deployed();
    const [lendPool, underlying, user] = await ethers.getSigners();
    await debtToken.initialize(
      await lendPool.getAddress(),
      await underlying.getAddress()
    );
    await debtToken.connect(lendPool).mint(await user.getAddress(), 100);
    expect(await debtToken.balanceOf(await user.getAddress())).to.equal(100);
    await debtToken.connect(lendPool).burn(await user.getAddress(), 100);
    expect(await debtToken.balanceOf(await user.getAddress())).to.equal(0);
    await expect(
      debtToken.connect(underlying).burn(await user.getAddress(), 100)
    ).to.be.revertedWith('Only lending pool can call this function');
  });
});
