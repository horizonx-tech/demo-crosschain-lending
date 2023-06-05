import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('SimpleKeyValueOracle', function () {
  it('should deploy', async function () {
    const oracle = await ethers.getContractFactory('SimpleKeyValueOracle');
    await oracle.deploy();
  });
  it('should set price', async function () {
    const oracle = await ethers.getContractFactory('SimpleKeyValueOracle');
    const instance = await oracle.deploy();
    await (await instance.setPrice('TST', 1)).wait();
    expect(await instance.getPriceInUsd('TST')).to.equal(1);
  });
});
