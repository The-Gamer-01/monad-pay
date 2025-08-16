# MonadPay

*基于 WalletConnect 深度链接协议的规范，用于在 URL 中编码 Monad 交易请求，以启用支付、NFC 和其他用例。发送、请求和触发加密支付的最简单方法--只需一个链接。*

## ✨ 最新功能

- 🔗 **WalletConnect 深度链接协议** - 支持标准 WalletConnect URI 格式和自定义 URL 架构
- 📱 **移动端优化** - 智能钱包检测和选择界面，提供最佳移动体验
- 🎯 **多钱包支持** - MetaMask、Rainbow、Rabby、Coinbase、Trust Wallet 等主流钱包
- 📡 **NFC 物理芯片支持** - 将支付链接编码到 NFC 芯片，实现离线到在线的无缝支付
- 🔄 **智能回退机制** - 自动检测钱包安装状态，提供最佳用户体验
- 🛡️ **安全优化** - 链接过期、参数验证、错误处理等安全特性

## 🛠 使用案例

MonadPay 支持**链接原生加密支付**。比如`monadpay://send?to=0x123...&amount=10&token=USDC`- 嵌入到任何地方。

- **创作者和商家：**在社交媒体、电子邮件、QR 码、NFC 芯片或发票上分享支付链接
- **DApps 和机器人：**通过 URL 触发链上支付，无需开发钱包用户界面
- **NFC / Physical UX：**带有 MonadPay 链接的贴纸或芯片可将离线互动转化为即时支付
- **Telegram / Farcaster / 电子邮件支付：**只需轻点一下，即可打开钱包，进行预先填充的交易
- **移动端支付：**智能检测已安装钱包，提供一键支付体验
- **跨平台兼容：**支持桌面端和移动端，自动适配最佳用户界面

## 🔗 深度链接协议

### WalletConnect URI 格式
```
wc:topic@version?bridge=<bridge_url>&key=<key>
```

### MonadPay 自定义格式
```
monadpay://send?to=<address>&amount=<value>&token=<token_address_or_symbol>
```

### 标准 URL 架构
```
https://pay.monad.link/send?to=<address>&amount=<value>&token=<token>
```

### 支持的参数
- `to`: 收款地址 (必需)
- `amount`: 支付金额 (必需)
- `token`: 代币地址或符号 (可选，默认为 MON)
- `label`: 支付描述标签 (可选)
- `message`: 支付备注信息 (可选)
- `expires`: 链接过期时间戳 (可选)
- `callback`: 支付完成后的回调URL (可选)
- `chainId`: 目标链ID (可选，默认为 Monad)

### 示例链接
```bash
# 基础支付
monadpay://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=10&token=USDC

# WalletConnect 深度链接
wc:monadpay@1?bridge=https://bridge.walletconnect.org&key=abc123

# 网页回退链接
https://pay.monad.link/send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=5&token=MON

# NFC 编码链接
monadpay://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=100&token=USDC&expires=1735689600&nfc=true
```

## 🛠 技术栈

| **组件** | **技术与细节** |
| --- | --- |
| **钱包集成** | WalletConnect 深度链接协议<br/>Reown / Privy 用于授权和嵌入式钱包<br/>MetaMask、Rainbow、Rabby、Coinbase、Trust Wallet 支持 |
| **深度链接** | WalletConnect URI 格式<br/>自定义 monadpay:// 协议<br/>标准 HTTPS 回退机制 |
| **前端框架** | Next.js 14 + TypeScript<br/>TailwindCSS + Headless UI<br/>React Hooks + Context API |
| **移动端优化** | 响应式设计<br/>智能钱包检测<br/>移动端专用选择器组件 |
| **NFC 支持** | NFC 数据编码<br/>物理芯片集成<br/>离线到在线支付桥接 |
| **智能合约** | Solidity 0.8.19<br/>OpenZeppelin 安全库<br/>多Token/多收件人支付支持 |
| **区块链** | Monad 主网/测试网<br/>EVM 兼容，低 Gas 费用<br/>高性能交易处理 |
| **开发工具** | Hardhat 开发环境<br/>TypeScript 类型安全<br/>ESLint + Prettier 代码规范 |

## 📋 开发进度

### 核心功能
- [x] 项目需求分析和架构设计
- [x] WalletConnect 深度链接协议实现
- [x] Next.js 前端框架搭建
- [x] 高级链接生成器实现
- [x] 多钱包集成和检测
- [x] 深度链接解析和路由
- [x] QR码生成和显示功能

### 移动端优化
- [x] 响应式设计实现
- [x] 移动端钱包选择器
- [x] 智能钱包检测逻辑
- [x] 触摸友好的用户界面

### 高级功能
- [x] NFC 物理芯片支持
- [x] 智能回退机制
- [x] 链接过期和验证
- [x] 错误处理和用户反馈

### 智能合约
- [x] MonadPay 合约开发
- [x] Monad 测试网部署
- [x] 合约验证和测试
- [ ] 主网部署和审计

### 文档和部署
- [x] 部署指南编写
- [x] 快速部署脚本
- [x] 静态部署支持
- [ ] API 文档完善
- [ ] 用户使用指南

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/monad-gaming.git
cd monad-gaming

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加你的 Reown Project ID

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 开始使用！

### 快速部署

```bash
# 构建项目
npm run build

# 部署到 Vercel
npx vercel --prod

# 或部署到 Netlify
npm run deploy:netlify
```

## 📖 文档

- [部署指南](./DEPLOYMENT.md) - 详细的部署说明
- [快速部署](./QUICK_DEPLOY.md) - 5分钟快速部署
- [智能合约部署](./SMART_CONTRACT_DEPLOYMENT.md) - 合约部署指南
- [Monad 网络部署](./MONAD_DEPLOYMENT.md) - Monad 专用部署
- [静态部署](./STATIC_DEPLOY.md) - 静态网站部署

## 🎯 核心特性

### WalletConnect 深度链接
- 支持标准 WalletConnect URI 格式
- 自定义 monadpay:// 协议
- 智能回退到网页版本

### 多钱包支持
- MetaMask - 最流行的以太坊钱包
- Rainbow - 用户友好的移动钱包
- Rabby - 专业的 DeFi 钱包
- Coinbase Wallet - 主流交易所钱包
- Trust Wallet - 多链移动钱包

### 移动端优化
- 自动检测移动设备
- 智能钱包安装检测
- 移动端专用选择界面
- 触摸优化的用户体验

### NFC 物理集成
- NFC 数据编码和下载
- 物理芯片支付支持
- 离线到在线支付桥接
- 实体商店集成方案

## 🔧 API 接口

### 生成支付链接
```javascript
const paymentLink = generatePaymentLink({
  to: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
  amount: '10',
  token: 'USDC',
  label: 'Coffee Payment',
  message: 'Thanks for the coffee!'
});
```

### 检测钱包
```javascript
const walletStatus = await detectWalletInstallation('metamask');
if (walletStatus.installed) {
  openWalletWithFallback(walletStatus.deepLink);
}
```

### NFC 数据生成
```javascript
const nfcData = generateNFCData({
  url: paymentLink,
  format: 'uri'
});
```