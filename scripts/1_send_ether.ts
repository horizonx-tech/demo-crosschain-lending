import { ethers } from 'hardhat';
const main = async () => {
  const signer = (await ethers.getSigners())[0];
  const to = process.env.to;
  // send 1 ether to the address
  await signer.sendTransaction({
    to,
    value: ethers.utils.parseEther('0.1'),
  });
};
main()
  .then((result) => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
