import { IDebtToken } from './../../typechain-types/contracts/interfaces/IDebtToken';
import hre from 'hardhat';
import {
  ChainsightAdapter__factory,
  IChainsigtAdapter__factory,
  ICreditToken__factory,
  IDebtToken__factory,
  ILendingPool__factory,
  IPriceOracle__factory,
  LendingPool__factory,
  MintableErc20__factory,
  SimpleKeyValueOracle__factory,
} from '../../typechain-types';
import { Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';

const NETWORK = hre.network.name;
const PATH = `./contracts/deployments/${NETWORK}.json`;

export const saveAddress = async (name: string, address: string) => {
  const fs = require('fs');
  // create file if not exists
  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, '{}');
  }
  const data = JSON.parse(fs.readFileSync(PATH, 'utf8'));
  data[name] = address;
  fs.writeFileSync(PATH, JSON.stringify(data));
};

export const saveConstructors = async (name: string, constructors: any[]) => {
  const fs = require('fs');
  // create file if not exists
  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, '{}');
  }
  const data = JSON.parse(fs.readFileSync(PATH, 'utf8'));
  if (!data['constructors']) {
    data['constructors'] = {};
  }
  data['constructors'][name] = constructors;
  fs.writeFileSync(PATH, JSON.stringify(data));
};

export const readAddress = async (name: string): Promise<string> => {
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(PATH, 'utf8'));
  return data[name] as string;
};

export const contractNames = async (): Promise<string[]> => {
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(PATH, 'utf8'));
  // eliminate constructors from data
  return Object.keys(data).filter((name) => name !== 'constructors');
};

export const readConstructors = async (name: string): Promise<any[]> => {
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(PATH, 'utf8'));
  return data['constructors'][name] as any[];
};

export const lendPool = async (signerOrProvider: Signer | Provider) =>
  ILendingPool__factory.connect(
    await readAddress('LendingPool'),
    signerOrProvider
  );

export const underlying0 = async (signerOrProvider: Signer | Provider) =>
  MintableErc20__factory.connect(
    await readAddress('MintableErc20-TST0'),
    signerOrProvider
  );

export const underlying1 = async (signerOrProvider: Signer | Provider) =>
  MintableErc20__factory.connect(
    await readAddress('MintableErc20-TST1'),
    signerOrProvider
  );

export const credit0 = async (signerOrProvider: Signer | Provider) =>
  ICreditToken__factory.connect(
    await readAddress('CreditToken-TST0'),
    signerOrProvider
  );

export const credit1 = async (signerOrProvider: Signer | Provider) =>
  ICreditToken__factory.connect(
    await readAddress('CreditToken-TST1'),
    signerOrProvider
  );

export const debt0 = async (signerOrProvider: Signer | Provider) =>
  IDebtToken__factory.connect(
    await readAddress('DebtToken-TST0'),
    signerOrProvider
  );

export const debt1 = async (signerOrProvider: Signer | Provider) =>
  IDebtToken__factory.connect(
    await readAddress('DebtToken-TST1'),
    signerOrProvider
  );

export const oracle = async (signerOrProvider: Signer | Provider) =>
  SimpleKeyValueOracle__factory.connect(
    await readAddress('Oracle'),
    signerOrProvider
  );

export const adapter = async (signerOrProvider: Signer | Provider) =>
  IChainsigtAdapter__factory.connect(
    await readAddress('ChainsightAdapter'),
    signerOrProvider
  );
