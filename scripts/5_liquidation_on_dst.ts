import { readAddress } from './deployments/contracts';
import {
  DebtToken__factory,
  LendingPool__factory,
  MintableErc20__factory,
} from '../typechain-types';
import { parseEther } from 'ethers/lib/utils';
import { alice, bob } from './contracts/utils';
const main = async () => {
  const lendingPool = LendingPool__factory.connect(
    await readAddress('LendingPool'),
    await bob()
  );
  const dbtTUSD = await readAddress('DebtToken-TUSD');
  const debtToken = DebtToken__factory.connect(dbtTUSD, await alice());
  const aliceAddress = (await alice()).getAddress();
  const bobAddress = (await bob()).getAddress();
  const debtBalance = await debtToken.balanceOf(aliceAddress);
  console.log(debtBalance.toString(), 'debtBalance');
  const daiAddress = await readAddress('DAI');
  const tusdAddress = await readAddress('TUSD');
  const hf = await lendingPool.healthFactorOf(aliceAddress);
  console.log('health factor:', hf.toString());
  // mint TST0 behalf of bob
  const dai = MintableErc20__factory.connect(daiAddress, await bob());
  await (await dai.mint(bobAddress, parseEther('100'))).wait();
  await (
    await dai
      .connect(await bob())
      .approve(lendingPool.address, parseEther('100'))
  ).wait();
  await (await lendingPool.deposit(daiAddress, parseEther('100'))).wait();
  // mint TST1 behalf of bob
  const mintableERC20_TUSD = MintableErc20__factory.connect(
    tusdAddress,
    await bob()
  );
  await (await mintableERC20_TUSD.mint(bobAddress, parseEther('10000'))).wait();
  await (
    await mintableERC20_TUSD
      .connect(await bob())
      .approve(lendingPool.address, parseEther('10000'))
  ).wait();

  //
  await lendingPool
    .connect(await bob())
    .liquidationCall(daiAddress, tusdAddress, aliceAddress, parseEther('1'));
};
main()
  .then((result) => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
