# MonadPay 智能合约部署指南

## 快速开始

### 1. 安装依赖

```bash
# 安装 Hardhat 和相关依赖
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

### 2. 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下变量：

```env
# 必需配置
PRIVATE_KEY=你的私钥
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
FEE_RECIPIENT=你的费用接收地址

# 可选配置
GAS_PRICE=1000000000
GAS_LIMIT=8000000
```

⚠️ **安全提醒**: 永远不要将私钥提交到版本控制系统！

### 3. 编译合约

```bash
npx hardhat compile
```

### 4. 部署到 Monad 测试网

```bash
# 部署到 Monad 测试网
npx hardhat run scripts/deploy-monad.js --network monadTestnet
```

### 5. 部署到 Monad 主网

```bash
# 部署到 Monad 主网 (谨慎操作)
npx hardhat run scripts/deploy-monad.js --network monadMainnet
```

## 详细配置

### 网络配置

项目已配置以下网络：

- **monadTestnet**: Monad 测试网
  - RPC: `https://testnet-rpc.monad.xyz`
  - Chain ID: `41454`
  - 区块浏览器: `https://testnet-explorer.monad.xyz`

- **monadMainnet**: Monad 主网
  - RPC: `https://rpc.monad.xyz`
  - Chain ID: `41455`
  - 区块浏览器: `https://explorer.monad.xyz`

### 获取测试代币

在部署到测试网之前，你需要获取 Monad 测试网代币：

1. 访问 [Monad 测试网水龙头](https://faucet.monad.xyz)
2. 输入你的钱包地址
3. 请求测试代币
4. 等待代币到账（通常几分钟内）

### 验证部署

部署完成后，脚本会自动：

1. ✅ 显示合约地址
2. ✅ 显示交易哈希
3. ✅ 测试基本功能
4. ✅ 保存部署信息到 JSON 文件
5. ✅ 尝试在区块浏览器上验证合约

### 部署后配置

部署成功后，需要更新前端配置：

1. 复制合约地址
2. 更新 `src/config/contracts.ts` 中的合约地址
3. 确保前端连接到正确的网络

```typescript
// src/config/contracts.ts
export const CONTRACTS = {
  MONAD_TESTNET: {
    MONAD_PAY: "0x你的合约地址",
    CHAIN_ID: 41454,
    RPC_URL: "https://testnet-rpc.monad.xyz"
  },
  MONAD_MAINNET: {
    MONAD_PAY: "0x你的合约地址",
    CHAIN_ID: 41455,
    RPC_URL: "https://rpc.monad.xyz"
  }
};
```

## 故障排除

### 常见错误

1. **`Error: insufficient funds for gas * price + value`**
   - 解决方案: 确保钱包有足够的 MON 代币支付 Gas 费用

2. **`Error: network does not support ENS`**
   - 解决方案: 这是正常的，Monad 网络不支持 ENS

3. **`Error: contract verification failed`**
   - 解决方案: 手动在区块浏览器上验证合约

4. **`Error: nonce too low`**
   - 解决方案: 重置 MetaMask 账户或等待网络同步

### 调试技巧

1. **检查网络连接**:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     https://testnet-rpc.monad.xyz
   ```

2. **检查账户余额**:
   ```bash
   npx hardhat run --network monadTestnet scripts/check-balance.js
   ```

3. **本地测试**:
   ```bash
   # 启动本地节点
   npx hardhat node
   
   # 在另一个终端部署
   npx hardhat run scripts/deploy-monad.js --network localhost
   ```

## 高级配置

### 自定义 Gas 设置

```javascript
// hardhat.config.js
monadTestnet: {
  url: "https://testnet-rpc.monad.xyz",
  accounts: [process.env.PRIVATE_KEY],
  chainId: 41454,
  gasPrice: 2000000000, // 2 Gwei
  gas: 10000000,        // 10M Gas
  timeout: 120000       // 2 分钟超时
}
```

### 多重签名部署

如果使用多重签名钱包部署：

```bash
# 生成部署交易数据
npx hardhat run scripts/generate-deploy-tx.js --network monadTestnet

# 将生成的交易数据提交到多签钱包
```

### 合约升级

如果需要升级合约，使用代理模式：

```bash
# 安装 OpenZeppelin 升级插件
npm install --save-dev @openzeppelin/hardhat-upgrades

# 部署可升级合约
npx hardhat run scripts/deploy-upgradeable.js --network monadTestnet
```

## 安全检查清单

部署前请确认：

- [ ] 私钥安全存储，未提交到代码库
- [ ] 合约代码已经过审计
- [ ] 测试网部署和测试完成
- [ ] Gas 限制和价格设置合理
- [ ] 费用接收地址正确
- [ ] 合约参数配置正确
- [ ] 备份部署信息和私钥

## 监控和维护

部署后建议：

1. **设置监控**: 监控合约交易和状态
2. **定期备份**: 备份部署信息和配置
3. **更新文档**: 记录合约地址和重要信息
4. **安全审计**: 定期进行安全检查

## 支持

如果遇到问题：

1. 查看 [Monad 官方文档](https://docs.monad.xyz)
2. 加入 [Monad Discord](https://discord.gg/monad)
3. 查看 [Hardhat 文档](https://hardhat.org/docs)
4. 提交 GitHub Issue

---

**祝你部署成功！** 🚀