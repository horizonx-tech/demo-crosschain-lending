import { ethers } from 'hardhat';
import { saveAddress, saveConstructors } from '../deployments/contracts';

export const deployMockToken = async (symbol: string, name: string) => {
  const mintableERC20 = await (
    await ethers.getContractFactory('MintableErc20')
  ).deploy(name, symbol);
  await mintableERC20.deployed();
  await saveAddress(symbol, mintableERC20.address);
  await saveConstructors(symbol, [name, symbol]);
  const creditToken = await (
    await ethers.getContractFactory('CreditToken')
  ).deploy(`Credit ${name}`, `CRD${symbol}`);
  await creditToken.deployed();
  await saveAddress(`CreditToken-${symbol}`, creditToken.address);
  await saveConstructors(`CreditToken-${symbol}`, [
    `Credit ${name}`,
    `CRD${symbol}`,
  ]);
  const debtToken = await (
    await ethers.getContractFactory('DebtToken')
  ).deploy(`Debt ${name}`, `DBT${symbol}`);
  await debtToken.deployed();
  await saveAddress(`DebtToken-${symbol}`, debtToken.address);
  await saveConstructors(`DebtToken-${symbol}`, [
    `Debt ${name}`,
    `DBT${symbol}`,
  ]);
  return { mintableERC20, creditToken, debtToken };
};
