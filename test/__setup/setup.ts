import { ethers } from 'hardhat';
import { deployMockToken } from '../../scripts/contracts/helpers';
import { ZERO_ADDRESS } from '../../scripts/contracts/utils';

const TOKENS_COUNT = 2;
export const setup = async () => {
  const LendingPool = await ethers.getContractFactory('LendingPool');
  const lendingPool = await LendingPool.deploy();
  await lendingPool.deployed();
  let tokens = [];
  for (const i of Array(TOKENS_COUNT).keys()) {
    const { creditToken, debtToken, mintableERC20 } = await deployMockToken(
      `TST${i}`,
      `Test${i}`
    );
    await creditToken.initialize(
      lendingPool.address,
      mintableERC20.address,
      ZERO_ADDRESS
    );
    await debtToken.initialize(lendingPool.address, mintableERC20.address);
    await lendingPool.initReserve(
      mintableERC20.address,
      creditToken.address,
      debtToken.address
    );
    tokens.push({
      mintableERC20,
      creditToken,
      debtToken,
    });
  }

  const oracle = await (
    await ethers.getContractFactory('SimpleKeyValueOracle')
  ).deploy();
  await oracle.deployed();
  await lendingPool.setOracle(oracle.address);

  return {
    lendingPool,
    tokens: {
      0: tokens[0],
      1: tokens[1],
    },
    oracle,
  };
};
