import { ethers } from 'hardhat';
import { oracle } from './deployments/contracts';
import { parseEther } from 'ethers/lib/utils';
// oracle price gets high (TUSD) up to 10x
const main = async () => {
  const deployer = (await ethers.getSigners())[0];

  await (
    await (await oracle(deployer)).setPrice('TUSD', parseEther('10'))
  ).wait();
};
main()
  .then((result) => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
