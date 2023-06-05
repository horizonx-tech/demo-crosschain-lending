import { ethers } from 'hardhat';
import { readAddress } from './deployments/contracts';
import {
  LendingPool__factory,
  MintableErc20__factory,
} from '../typechain-types';
import { parseEther } from 'ethers/lib/utils';
import { alice } from './contracts/utils';
const main = async () => {
  const dai = MintableErc20__factory.connect(
    await readAddress('DAI'),
    await alice()
  );
  const lendingPool = LendingPool__factory.connect(
    await readAddress('LendingPool'),
    await alice()
  );
  const amount = ethers.utils.parseEther('1000');
  await (await dai.mint((await alice()).getAddress(), amount)).wait();
  await (
    await dai.approve(lendingPool.address, ethers.constants.MaxUint256)
  ).wait();
  await (await lendingPool.deposit(dai.address, amount)).wait();
  // arbitrum goerli
  await (await lendingPool.lockFor(dai.address, amount, 421613)).wait();
};
main()
  .then((result) => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
