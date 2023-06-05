import { ethers } from 'hardhat';
import { deployMockToken } from './contracts/helpers';
import { ZERO_ADDRESS } from './contracts/utils';
import { saveAddress, saveConstructors } from './deployments/contracts';
const TOKENS = ['DAI', 'TUSD'];
const main = async () => {
  const signer = (await ethers.getSigners())[0];
  console.log(await signer.getAddress());
  const LendingPool = await ethers.getContractFactory('LendingPool');
  const lendingPool = await LendingPool.deploy();
  await lendingPool.deployed();
  await saveAddress('LendingPool', lendingPool.address);
  const adapter = await (
    await ethers.getContractFactory('ChainsightAdapter')
  ).deploy(lendingPool.address);
  await saveConstructors('ChainsightAdapter', [lendingPool.address]);
  let tokens = [];

  for (const i of TOKENS) {
    const { creditToken, debtToken, mintableERC20 } = await deployMockToken(
      i,
      `Test${i}`
    );
    await (
      await creditToken.initialize(
        lendingPool.address,
        mintableERC20.address,
        ZERO_ADDRESS
      )
    ).wait();

    await (
      await debtToken.initialize(lendingPool.address, mintableERC20.address)
    ).wait();
    await (
      await lendingPool.initReserve(
        mintableERC20.address,
        creditToken.address,
        debtToken.address
      )
    ).wait();
    await (await creditToken.setChainsight(adapter.address)).wait();
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
  await saveAddress('Oracle', oracle.address);
  await (await lendingPool.setOracle(oracle.address)).wait();

  await saveAddress('ChainsightAdapter', adapter.address);

  return {
    lendingPool,
    tokens: {
      0: tokens[0],
      1: tokens[1],
    },
    oracle,
    adapter,
  };
};
main()
  .then((result) => {
    console.log('LendingPool deployed to:', result.lendingPool.address);
    for (const token of Object.values(result.tokens)) {
      console.log('MintableERC20 deployed to:', token.mintableERC20.address);
      console.log('CreditToken deployed to:', token.creditToken.address);
      console.log('DebtToken deployed to:', token.debtToken.address);
    }
    console.log('Oracle deployed to:', result.oracle.address);
    console.log('ChainsightAdapter deployed to:', result.adapter.address);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
