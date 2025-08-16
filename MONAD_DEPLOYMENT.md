# MonadPay 智能合约部署到 Monad 网络指南

## 概述

本指南将帮助你将 MonadPay 智能合约部署到 Monad 网络。Monad 是一个高性能的 EVM 兼容区块链，支持以太坊智能合约的无缝迁移。

## 前置要求

- Node.js 18+
- npm 或 yarn
- 私钥（用于部署）
- Monad 测试网代币（用于 Gas 费用）

## 步骤 1: 安装开发工具

### 安装 Hardhat 和依赖

```bash
# 安装 Hardhat 和相关依赖
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts

# 初始化 Hardhat 项目
npx hardhat init
```

## 步骤 2: 配置 Hardhat

创建或更新 `hardhat.config.js`：

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Monad 测试网
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz", // Monad 测试网 RPC
      accounts: [process.env.PRIVATE_KEY],
      chainId: 41454, // Monad 测试网链 ID
      gasPrice: 1000000000, // 1 Gwei
      gas: 8000000
    },
    // Monad 主网 (当可用时)
    monadMainnet: {
      url: "https://rpc.monad.xyz", // Monad 主网 RPC
      accounts: [process.env.PRIVATE_KEY],
      chainId: 41455, // Monad 主网链 ID (待确认)
      gasPrice: 1000000000,
      gas: 8000000
    }
  },
  etherscan: {
    // Monad 区块浏览器配置 (如果支持)
    apiKey: {
      monadTestnet: process.env.MONAD_API_KEY || "dummy"
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 41454,
        urls: {
          apiURL: "https://testnet-api.monad.xyz/api",
          browserURL: "https://testnet-explorer.monad.xyz"
        }
      }
    ]
  }
};
```

## 步骤 3: 环境变量配置

创建 `.env` 文件：

```bash
# 部署者私钥 (不要提交到版本控制)
PRIVATE_KEY=your_private_key_here

# Monad API Key (如果需要)
MONAD_API_KEY=your_api_key_here

# 其他配置
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
```

## 步骤 4: 创建部署脚本

创建 `scripts/deploy-monad.js`：

```javascript
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 开始部署 MonadPay 到 Monad 网络...");
  
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  
  // 检查账户余额
  const balance = await deployer.getBalance();
  console.log("💰 账户余额:", ethers.utils.formatEther(balance), "MON");
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    console.warn("⚠️  警告: 账户余额较低，可能无法完成部署");
  }
  
  // 部署 MonadPay 合约
  console.log("📦 部署 MonadPay 合约...");
  const MonadPay = await ethers.getContractFactory("MonadPay");
  
  // 估算 Gas
  const deploymentData = MonadPay.getDeployTransaction().data;
  const estimatedGas = await deployer.estimateGas({ data: deploymentData });
  console.log("⛽ 估算 Gas:", estimatedGas.toString());
  
  // 部署合约
  const monadPay = await MonadPay.deploy({
    gasLimit: estimatedGas.mul(120).div(100) // 增加 20% 的 Gas 缓冲
  });
  
  console.log("⏳ 等待合约部署确认...");
  await monadPay.deployed();
  
  console.log("✅ MonadPay 合约部署成功!");
  console.log("📍 合约地址:", monadPay.address);
  console.log("🔗 交易哈希:", monadPay.deployTransaction.hash);
  
  // 等待更多确认
  console.log("⏳ 等待区块确认...");
  await monadPay.deployTransaction.wait(3);
  
  // 验证合约 (如果支持)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("🔍 验证合约...");
    try {
      await hre.run("verify:verify", {
        address: monadPay.address,
        constructorArguments: [],
      });
      console.log("✅ 合约验证成功!");
    } catch (error) {
      console.log("❌ 合约验证失败:", error.message);
    }
  }
  
  // 保存部署信息
  const deploymentInfo = {
    network: network.name,
    contractAddress: monadPay.address,
    deployerAddress: deployer.address,
    transactionHash: monadPay.deployTransaction.hash,
    blockNumber: monadPay.deployTransaction.blockNumber,
    gasUsed: (await monadPay.deployTransaction.wait()).gasUsed.toString(),
    timestamp: new Date().toISOString()
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    `deployment-${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("📄 部署信息已保存到:", `deployment-${network.name}.json`);
  console.log("🎉 部署完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
```

## 步骤 5: 获取测试代币

在部署之前，你需要获取 Monad 测试网代币：

1. 访问 Monad 测试网水龙头
2. 输入你的钱包地址
3. 获取测试代币用于 Gas 费用

## 步骤 6: 部署合约

### 部署到测试网

```bash
# 编译合约
npx hardhat compile

# 部署到 Monad 测试网
npx hardhat run scripts/deploy-monad.js --network monadTestnet
```

### 部署到主网 (当可用时)

```bash
# 部署到 Monad 主网
npx hardhat run scripts/deploy-monad.js --network monadMainnet
```

## 步骤 7: 验证部署

部署成功后，你应该看到类似的输出：

```
🚀 开始部署 MonadPay 到 Monad 网络...
📝 部署账户: 0x...
💰 账户余额: 10.0 MON
📦 部署 MonadPay 合约...
⛽ 估算 Gas: 3500000
⏳ 等待合约部署确认...
✅ MonadPay 合约部署成功!
📍 合约地址: 0x...
🔗 交易哈希: 0x...
🎉 部署完成!
```

## 步骤 8: 更新前端配置

部署成功后，更新前端配置以使用新的合约地址：

1. 更新 `src/lib/wagmi.ts` 中的网络配置
2. 添加 Monad 网络支持
3. 更新合约地址

```javascript
// src/lib/wagmi.ts
import { monadTestnet } from 'wagmi/chains';

// 添加 Monad 网络配置
const monadTestnet = {
  id: 41454,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    public: { http: ['https://testnet-rpc.monad.xyz'] },
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet-explorer.monad.xyz' },
  },
};

// 更新合约地址
export const MONADPAY_CONTRACT_ADDRESS = {
  [monadTestnet.id]: '0x...', // 你的合约地址
};
```

## 故障排除

### 常见问题

1. **Gas 估算失败**
   - 检查账户余额
   - 增加 Gas 限制
   - 确认网络连接

2. **RPC 连接问题**
   - 验证 RPC URL
   - 检查网络状态
   - 尝试不同的 RPC 端点

3. **私钥问题**
   - 确保私钥格式正确
   - 检查 .env 文件配置
   - 验证账户权限

### 有用的命令

```bash
# 检查网络连接
npx hardhat console --network monadTestnet

# 验证合约
npx hardhat verify --network monadTestnet CONTRACT_ADDRESS

# 查看账户余额
npx hardhat run scripts/check-balance.js --network monadTestnet
```

## 下一步

1. 测试合约功能
2. 配置前端连接
3. 进行安全审计
4. 准备主网部署

## 支持

如果遇到问题，请：

1. 检查 Monad 官方文档
2. 访问 Monad 社区论坛
3. 查看项目 GitHub Issues

---

**注意**: Monad 网络的具体配置可能会随着网络发展而变化，请参考最新的官方文档。