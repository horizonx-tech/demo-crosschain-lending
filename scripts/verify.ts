import {
  contractNames,
  readAddress,
  readConstructors,
} from './deployments/contracts';

const hre = require('hardhat');
const main = async () => {
  const promises = (await contractNames()).map((v) => verify(v));
  const CHUNK = 3;
  let executions = [];
  for (let i = 0; i < promises.length; i++) {
    executions.push(promises[i]);
    if ((i + 1) % CHUNK === 0) {
      await Promise.all(executions);
      executions = [];
    }
  }
};
const verify = async (name: string) => {
  try {
    await hre.run('verify:verify', {
      address: await readAddress(name),
      constructorArguments: await readConstructors(name),
    });
  } catch (e) {
    if ((e as any).message.includes('Contract source code already verified')) {
      return;
    }
    if ((e as any).message.includes('Already Verified')) {
      return;
    }
    try {
      // wait 1 sec
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await verify(name);
    } catch (e) {
      throw e;
    }
  }
};

main()
  .then((result) => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
