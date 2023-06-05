import { readAddress } from './deployments/contracts';
import {
  ICreditToken__factory,
  LendingPool__factory,
  MintableErc20__factory,
} from '../typechain-types';
import { alice, bob } from './contracts/utils';
const main = async () => {
  const lendingPool = LendingPool__factory.connect(
    await readAddress('LendingPool'),
    await alice()
  );
  const creditDAI = ICreditToken__factory.connect(
    await readAddress('CreditToken-DAI'),
    await alice()
  );
  const creditAmount = await creditDAI.collateralAmountOf(
    (await alice()).getAddress()
  );
  console.log('credit', creditAmount.toString());
  const mintableERC20_TUSD = MintableErc20__factory.connect(
    await readAddress('TUSD'),
    await bob()
  );
  await (
    await mintableERC20_TUSD.mint((await bob()).getAddress(), creditAmount)
  ).wait();
  await (
    await mintableERC20_TUSD
      .connect(await bob())
      .approve(lendingPool.address, creditAmount)
  ).wait();
  await (
    await lendingPool
      .connect(await bob())
      .deposit(mintableERC20_TUSD.address, creditAmount)
  ).wait();

  const tusdAddress = await readAddress('TUSD');
  await (
    await lendingPool
      .connect(await alice())
      .borrow(tusdAddress, creditAmount.mul(8).div(10).sub(100))
  ).wait();
};
main()
  .then((result) => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
