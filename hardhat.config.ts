import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-abi-exporter';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import '@nomiclabs/hardhat-etherscan';
const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || './.env';
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });
const mnemonic: string = process.env.MNEMONIC || 'test t';
const alchemyOptimismKey: string = process.env.ALCHEMY_OPTIMISM_KEY || 'test t';
const alchemyArbitrumKey: string = process.env.ALCHEMY_ARBITRUM_KEY || 'test t';
const etherscanOptimismKey: string =
  process.env.ETHERSCAN_OPTIMISM_KEY || 'test t';
const etherscanArbitrumKey: string =
  process.env.ETHERSCAN_ARBITRUM_KEY || 'test t';

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: '0.8.9' }],
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  etherscan: {
    apiKey: {
      optimismTest: etherscanOptimismKey,
      scrollAlpha: 'abc',
      arbitrumGoerli: etherscanArbitrumKey,
    },
    customChains: [
      {
        network: 'optimismTest',
        chainId: 420,
        urls: {
          apiURL: 'https://api-goerli-optimistic.etherscan.io/api',
          browserURL: 'https://goerli-optimism.etherscan.io',
        },
      },
      {
        network: 'scrollAlpha',
        chainId: 534353,
        urls: {
          apiURL: 'https://blockscout.scroll.io/api',
          browserURL: 'https://blockscout.scroll.io/',
        },
      },
    ],
  },
  networks: {
    mumbai: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
    shiden: {
      url: 'https://rpc.shiden.astar.network',
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
    astar: {
      url: 'https://rpc.astar.network',
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
    goerli: {
      url: 'https://ethereum-goerli.publicnode.com',
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
    optimismTest: {
      url: `https://opt-goerli.g.alchemy.com/v2/${alchemyOptimismKey}`,
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
    scrollAlpha: {
      url: 'https://alpha-rpc.scroll.io/l2',
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
    arbitrumGoerli: {
      url: `https://arb-goerli.g.alchemy.com/v2/${alchemyArbitrumKey}`,
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
  },
  abiExporter: {
    path: './abi',
    format: 'json',
    runOnCompile: true,
    only: ['contracts/interfaces/*'],
    flat: true,
  },
};

export default config;
