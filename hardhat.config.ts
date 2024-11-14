import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import '@openzeppelin/hardhat-upgrades';
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-solhint";
import dotenv from 'dotenv';
dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  allowUnlimitedContractSize: true,
  networks: {
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
      accounts: { mnemonic: process.env.REACT_APP_MNEMONIC },
    },
    hardhat: {
      accounts: {
        accountsBalance: "100000000000000000000000",
        count: 70,
      },
      mining: {
        auto: true, // Enable automatic mining
      },
    }
  },
   // configuration for harhdat-verify plugin
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.REACT_APP_ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",  // Replace with the actual API URL
          browserURL: "https://amoy.polygonscan.com"  // Replace with the actual browser URL
        }
      }
    ]
  },
  // configuration for etherscan-verify from hardhat-deploy plugin
  verify: {
    etherscan: {
      apiKey: process.env.REACT_APP_ETHERSCAN_API_KEY,
    },
  },
  sourcify: {
    enabled: false,
  },
};

export default config;

