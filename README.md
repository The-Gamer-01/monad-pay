# MonadPay

*基于 Deeplinks 的规范，用于在 URL 中编码 Monad 交易请求，以启用支付、NFC 和其他用例。发送、请求和触发加密支付的最简单方法--只需一个链接。*

## 🛠 使用案例

MonadPay 支持**链接原生加密支付**。比如`monadpay://send?to=0x123...&amount=10&token=USDC`- 嵌入到任何地方。

- **创作者和商家：**在社交媒体、电子邮件、QR 码、NFC 芯片或发票上分享支付链接。
- **DApps 和机器人：**通过 URL 触发链上支付，无需开发钱包用户界面。
- **NFC / Physical UX：**带有 MonadPay 链接的贴纸或芯片可将离线互动转化为即时支付。
- **Telegram / Farcaster / 电子邮件支付：**只需轻点一下，即可打开钱包，进行预先填充的交易。

## URL Schema 设计

### 基础支付格式
```
monadpay://send?to=<address>&amount=<value>&token=<token_address_or_symbol>
```

### 支持的参数
- `to`: 收款地址 (必需)
- `amount`: 支付金额 (必需)
- `token`: 代币地址或符号 (可选，默认为 MON)
- `label`: 支付描述标签 (可选)
- `message`: 支付备注信息 (可选)
- `expires`: 链接过期时间戳 (可选)
- `callback`: 支付完成后的回调URL (可选)

### 示例链接
```
# 基础支付
monadpay://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=10&token=USDC

# 带标签和消息的支付
monadpay://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=5&token=MON&label=coffee&message=Thanks%20for%20the%20coffee!

# 带过期时间的支付
monadpay://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=100&token=USDC&expires=1735689600
```

## 技术栈

| **组件** | **技术与细节** |
| --- | --- |
| 钱包支持 | WalletConnect 深度链接协议<br/>Reown / Privy 用于授权和嵌入式钱包<br/>MetaMask、Rabby、Rainbow 支持通过 monadpay:// 或 `https://pay.monad.link/...` |
| 前端 | Next.js + TailwindCSS（用于链接管理的仪表板） |
| 智能合约 | 用于多Token/多收件人支付、订阅、解锁的 Solidity 合约 |
| 区块链 | Monad（与 EVM 兼容，省gas版） |
| 人工智能工具 | 用于构思的 GPT-4/Claude<br/>用于营销页面的 Galileo AI/v0.dev<br/>用于 TypeScript/智能合约开发的 Cursor IDE |

## 开发进度

- [x] 项目需求分析
- [x] URL Schema 设计
- [ ] Next.js 前端框架搭建
- [ ] 链接生成器实现
- [ ] 钱包集成
- [ ] 深度链接解析
- [ ] 智能合约开发
- [ ] 演示和QR码功能