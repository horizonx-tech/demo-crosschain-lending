import { Wallet } from 'ethers';
import { ethers } from 'hardhat';

export const ONE_ETHER = ethers.utils.parseEther('1');
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const alice = async () => {
  return (await ethers.getSigners())[2];
};

export const bob = async () => {
  return (await ethers.getSigners())[1];
};
