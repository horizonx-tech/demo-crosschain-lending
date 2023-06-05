import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('MintableERC20', function () {
  async function deployMintableERC20() {
    const mintableERC20 = await ethers.getContractFactory('MintableErc20');
    return await mintableERC20.deploy('Name', 'Symbol');
  }

  describe('Deployment', function () {
    it('should deploy', async function () {
      await deployMintableERC20();
    });
    it('should mint', async function () {
      const [to] = await ethers.getSigners();
      const instance = await deployMintableERC20();
      await instance.mint(
        await to.getAddress(),
        ethers.utils.parseEther('100')
      );
      expect(await instance.balanceOf(await to.getAddress())).to.equal(
        ethers.utils.parseEther('100')
      );
    });
  });
});
