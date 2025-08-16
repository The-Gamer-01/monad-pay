# MonadPay API 文档

## 概述

MonadPay 提供了一套完整的 API 接口，支持深度链接生成、钱包集成、NFC 功能等。本文档详细说明了所有可用的接口和使用方法。

## 🔗 深度链接 API

### 1. 生成支付链接

#### `generatePaymentLink(params)`

生成标准的 MonadPay 支付链接。

**参数：**
```typescript
interface PaymentLinkParams {
  to: string;                    // 收款地址 (必需)
  amount: string;                // 支付金额 (必需)
  token?: string;                // 代币符号或地址 (可选，默认 MON)
  label?: string;                // 支付标签 (可选)
  message?: string;              // 支付消息 (可选)
  expires?: number;              // 过期时间戳 (可选)
  callback?: string;             // 回调 URL (可选)
  chainId?: number;              // 链 ID (可选)
}
```

**返回值：**
```typescript
interface PaymentLinkResult {
  monadpayLink: string;          // monadpay:// 深度链接
  webLink: string;               // https:// 网页链接
  qrCode: string;                // Base64 编码的二维码
}
```

**示例：**
```javascript
const result = generatePaymentLink({
  to: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
  amount: '10',
  token: 'USDC',
  label: 'Coffee Payment',
  message: 'Thanks for the coffee!'
});

console.log(result.monadpayLink);
// monadpay://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=10&token=USDC&label=Coffee%20Payment&message=Thanks%20for%20the%20coffee!
```

### 2. 解析支付链接

#### `parsePaymentLink(url)`

解析 MonadPay 支付链接，提取参数信息。

**参数：**
- `url: string` - 要解析的链接

**返回值：**
```typescript
interface ParsedPaymentLink {
  to: string;
  amount: string;
  token?: string;
  label?: string;
  message?: string;
  expires?: number;
  callback?: string;
  chainId?: number;
  isValid: boolean;
  errors?: string[];
}
```

**示例：**
```javascript
const parsed = parsePaymentLink('monadpay://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=10&token=USDC');

if (parsed.isValid) {
  console.log('收款地址:', parsed.to);
  console.log('支付金额:', parsed.amount);
  console.log('代币:', parsed.token);
}
```

## 🔌 钱包集成 API

### 1. 钱包检测

#### `detectWalletInstallation(walletId)`

检测指定钱包的安装状态。

**参数：**
- `walletId: string` - 钱包标识符 ('metamask', 'rainbow', 'rabby', 'coinbase', 'trust')

**返回值：**
```typescript
interface WalletDetectionResult {
  installed: boolean;            // 是否已安装
  supported: boolean;            // 是否支持当前平台
  deepLink: string;              // 深度链接
  fallbackLink: string;          // 回退链接
  confidence: number;            // 检测置信度 (0-1)
}
```

**示例：**
```javascript
const walletStatus = await detectWalletInstallation('metamask');

if (walletStatus.installed) {
  console.log('MetaMask 已安装');
  console.log('深度链接:', walletStatus.deepLink);
} else {
  console.log('MetaMask 未安装，使用回退链接:', walletStatus.fallbackLink);
}
```

### 2. 生成钱包深度链接

#### `generateWalletDeepLink(walletId, params)`

为指定钱包生成深度链接。

**参数：**
```typescript
interface DeepLinkParams {
  to: string;
  amount: string;
  token?: string;
  chainId?: number;
  data?: string;                 // 交易数据
}
```

**返回值：**
- `string` - 钱包专用的深度链接

**示例：**
```javascript
const deepLink = generateWalletDeepLink('metamask', {
  to: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
  amount: '10',
  token: 'USDC',
  chainId: 41454
});

console.log(deepLink);
// metamask://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=10&token=USDC&chainId=41454
```

### 3. 打开钱包（带回退）

#### `openWalletWithFallback(deepLink, fallbackUrl, options)`

尝试打开钱包应用，失败时使用回退方案。

**参数：**
```typescript
interface OpenWalletOptions {
  timeout?: number;              // 超时时间 (毫秒)
  onSuccess?: () => void;        // 成功回调
  onFallback?: () => void;       // 回退回调
  onError?: (error: Error) => void; // 错误回调
}
```

**示例：**
```javascript
openWalletWithFallback(
  'metamask://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=10',
  'https://pay.monad.link/send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=10',
  {
    timeout: 3000,
    onSuccess: () => console.log('钱包已打开'),
    onFallback: () => console.log('使用网页版本'),
    onError: (error) => console.error('打开失败:', error)
  }
);
```

### 4. 获取推荐钱包

#### `getRecommendedWallets(platform?)`

获取当前平台推荐的钱包列表。

**参数：**
- `platform?: 'mobile' | 'desktop' | 'all'` - 目标平台

**返回值：**
```typescript
interface RecommendedWallet {
  id: string;
  name: string;
  icon: string;
  downloadUrl: string;
  deepLinkScheme: string;
  priority: number;
}
```

**示例：**
```javascript
const mobileWallets = getRecommendedWallets('mobile');
mobileWallets.forEach(wallet => {
  console.log(`${wallet.name}: ${wallet.downloadUrl}`);
});
```

## 📡 NFC 功能 API

### 1. 生成 NFC 数据

#### `generateNFCData(params)`

生成用于 NFC 芯片的数据。

**参数：**
```typescript
interface NFCDataParams {
  url: string;                   // 要编码的 URL
  format?: 'uri' | 'text' | 'wifi'; // 数据格式
  title?: string;                // NFC 标题
  description?: string;          // NFC 描述
}
```

**返回值：**
```typescript
interface NFCData {
  ndef: Uint8Array;              // NDEF 格式数据
  hex: string;                   // 十六进制字符串
  base64: string;                // Base64 编码
  size: number;                  // 数据大小（字节）
}
```

**示例：**
```javascript
const nfcData = generateNFCData({
  url: 'monadpay://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=10',
  format: 'uri',
  title: 'MonadPay Payment',
  description: 'Tap to pay with crypto'
});

console.log('NFC 数据大小:', nfcData.size, '字节');
console.log('十六进制:', nfcData.hex);
```

### 2. 下载 NFC 数据

#### `downloadNFCData(nfcData, filename?)`

下载 NFC 数据文件，用于写入物理芯片。

**参数：**
- `nfcData: NFCData` - NFC 数据对象
- `filename?: string` - 文件名（可选）

**示例：**
```javascript
const nfcData = generateNFCData({
  url: 'monadpay://send?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=10'
});

downloadNFCData(nfcData, 'payment-chip.bin');
```

## 🔧 工具函数 API

### 1. 平台检测

#### `detectPlatform()`

检测当前运行平台。

**返回值：**
```typescript
type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
```

### 2. 移动端检测

#### `isMobile()`

检测是否为移动端设备。

**返回值：**
- `boolean` - 是否为移动端

### 3. 地址验证

#### `isValidAddress(address)`

验证以太坊地址格式。

**参数：**
- `address: string` - 要验证的地址

**返回值：**
- `boolean` - 地址是否有效

### 4. 金额格式化

#### `formatAmount(amount, decimals?)`

格式化显示金额。

**参数：**
- `amount: string | number` - 原始金额
- `decimals?: number` - 小数位数（默认 18）

**返回值：**
- `string` - 格式化后的金额

## 📱 React Hooks API

### 1. useWalletDetection

检测钱包状态的 React Hook。

```typescript
const {
  wallets,           // 钱包列表
  isLoading,         // 是否加载中
  refresh            // 刷新函数
} = useWalletDetection();
```

### 2. usePaymentLink

生成和管理支付链接的 React Hook。

```typescript
const {
  generateLink,      // 生成链接函数
  currentLink,       // 当前链接
  qrCode,           // 二维码
  isGenerating      // 是否生成中
} = usePaymentLink();
```

### 3. useNFC

NFC 功能管理的 React Hook。

```typescript
const {
  generateNFC,       // 生成 NFC 数据
  downloadNFC,       // 下载 NFC 文件
  nfcData,          // NFC 数据
  isSupported       // 是否支持 NFC
} = useNFC();
```

## 🚨 错误处理

### 错误类型

```typescript
enum MonadPayErrorType {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  NFC_NOT_SUPPORTED = 'NFC_NOT_SUPPORTED'
}

interface MonadPayError {
  type: MonadPayErrorType;
  message: string;
  details?: any;
}
```

### 错误处理示例

```javascript
try {
  const result = generatePaymentLink({
    to: 'invalid-address',
    amount: '10'
  });
} catch (error) {
  if (error.type === MonadPayErrorType.INVALID_ADDRESS) {
    console.error('地址格式无效:', error.message);
  }
}
```

## 🔐 安全注意事项

1. **地址验证**：始终验证收款地址格式
2. **金额检查**：确保金额在合理范围内
3. **链接过期**：设置合理的过期时间
4. **HTTPS 使用**：生产环境必须使用 HTTPS
5. **用户确认**：重要操作需要用户确认

## 📊 使用限制

- **链接长度**：建议不超过 2048 字符
- **QR 码复杂度**：避免过于复杂的 QR 码
- **NFC 数据大小**：建议不超过 8KB
- **并发请求**：避免频繁的 API 调用

## 🔄 版本兼容性

| API 版本 | 支持的功能 | 兼容性 |
|---------|-----------|--------|
| v1.0 | 基础支付链接 | ✅ 完全兼容 |
| v1.1 | 钱包检测 | ✅ 完全兼容 |
| v1.2 | NFC 支持 | ✅ 完全兼容 |
| v2.0 | WalletConnect 协议 | ✅ 当前版本 |

## 📞 技术支持

如果在使用 API 过程中遇到问题：

1. 查看本文档的相关章节
2. 检查浏览器控制台错误信息
3. 访问 [GitHub Issues](https://github.com/your-repo/issues)
4. 加入开发者社区讨论

---

**最后更新：** 2024年1月
**API 版本：** v2.0
**文档版本：** 1.0