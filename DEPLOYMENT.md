# MonadPay 部署指南

## 环境要求

- Node.js 18+
- npm 或 yarn
- Reown Cloud 账户 (用于获取 Project ID)

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.local` 文件并配置：
```bash
cp .env.local .env.local.example
```

在 `.env.local` 中设置：
```
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
```

获取 Project ID：
1. 访问 [Reown Cloud](https://cloud.reown.com)
2. 创建新项目
3. 复制 Project ID

### 3. 启动开发服务器
```bash
npm run dev
```

应用将在 http://localhost:3000 启动

## 生产部署

### Vercel 部署 (推荐)

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量 `NEXT_PUBLIC_REOWN_PROJECT_ID`
4. 部署

### 其他平台

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 智能合约部署

### 使用 Hardhat

1. 安装 Hardhat：
```bash
npm install --save-dev hardhat @openzeppelin/contracts
```

2. 初始化 Hardhat：
```bash
npx hardhat init
```

3. 配置网络 (hardhat.config.js)：
```javascript
module.exports = {
  solidity: "0.8.19",
  networks: {
    monad: {
      url: "https://rpc.monad.xyz", // Monad RPC URL
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

4. 部署合约：
```bash
npx hardhat run scripts/deploy.js --network monad
```

## 功能测试

### 测试链接生成
1. 访问主页
2. 填写支付信息
3. 生成链接和二维码

### 测试深度链接
1. 生成支付链接
2. 访问 `/pay?to=0x...&amount=10&token=MON`
3. 连接钱包并确认支付

### 测试钱包集成
1. 点击"连接钱包"按钮
2. 选择支持的钱包 (MetaMask, WalletConnect等)
3. 确认连接

## 故障排除

### 常见问题

1. **钱包连接失败**
   - 检查 Reown Project ID 是否正确
   - 确认网络配置

2. **二维码不显示**
   - 检查 qrcode 包是否正确安装
   - 确认链接格式正确

3. **支付失败**
   - 检查钱包余额
   - 确认网络连接
   - 查看浏览器控制台错误

### 调试模式

在开发环境中，可以在浏览器控制台查看详细日志：
```javascript
// 启用调试模式
localStorage.setItem('debug', 'monadpay:*')
```

## 安全注意事项

1. **私钥管理**
   - 永远不要在前端代码中硬编码私钥
   - 使用环境变量存储敏感信息

2. **输入验证**
   - 所有用户输入都经过验证
   - 地址格式检查
   - 金额范围限制

3. **智能合约安全**
   - 使用 OpenZeppelin 安全库
   - 实施重入攻击保护
   - 设置合理的费率上限

## 监控和分析

建议集成以下服务：
- **错误监控**: Sentry
- **分析**: Google Analytics 或 Mixpanel
- **性能监控**: Vercel Analytics