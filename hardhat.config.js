require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1
      },
      viaIR: true
    }
  },
  networks: {
    // 本地开发网络
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    // Monad 测试网
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz", // Monad 测试网 RPC
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here') ? [process.env.PRIVATE_KEY] : [],
      chainId: 10143, // Monad 测试网链 ID
      gasPrice: 1000000000, // 1 Gwei
      gas: 8000000,
      timeout: 60000
    },
    // Monad 主网 (当可用时)
    monadMainnet: {
      url: "https://rpc.monad.xyz", // Monad 主网 RPC
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here') ? [process.env.PRIVATE_KEY] : [],
      chainId: 41455, // Monad 主网链 ID (待确认)
      gasPrice: 1000000000,
      gas: 8000000,
      timeout: 60000
    },
    // 以太坊测试网 (用于测试)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here') ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },
  etherscan: {
    // Monad 区块浏览器配置 (如果支持)
    apiKey: {
      monadTestnet: process.env.MONAD_API_KEY || "dummy",
      sepolia: process.env.ETHERSCAN_API_KEY || "dummy"
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet-api.monad.xyz/api",
          browserURL: "https://testnet-explorer.monad.xyz"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};