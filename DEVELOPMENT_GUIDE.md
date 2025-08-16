# 🛠️ MonadPay 开发指南

本指南为开发者提供详细的项目架构说明、组件介绍和开发最佳实践。

## 📋 目录

- [项目架构](#项目架构)
- [技术栈详解](#技术栈详解)
- [目录结构](#目录结构)
- [核心组件](#核心组件)
- [开发工作流](#开发工作流)
- [代码规范](#代码规范)
- [测试指南](#测试指南)
- [性能优化](#性能优化)
- [最佳实践](#最佳实践)

## 🏗️ 项目架构

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用       │    │   智能合约       │    │   外部服务       │
│  (Next.js)      │    │  (Solidity)     │    │ (WalletConnect) │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • 用户界面       │    │ • MonadPay      │    │ • Reown Cloud   │
│ • 钱包集成       │◄──►│ • 支付逻辑       │    │ • 钱包服务       │
│ • 深度链接       │    │ • 安全验证       │    │ • NFC 服务      │
│ • NFC 支持      │    │ • 事件日志       │    │ • 区块链 RPC    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 数据流架构

```
用户操作 → 前端组件 → 钱包检测 → 深度链接生成 → 钱包唤起 → 交易确认 → 区块链
    ↓         ↓         ↓          ↓           ↓         ↓         ↓
  UI交互   状态管理   API调用   链接解析    钱包连接   交易签名   链上执行
```

## 🔧 技术栈详解

### 前端技术栈

| 技术 | 版本 | 用途 | 文档链接 |
|------|------|------|----------|
| **Next.js** | 14.x | React 框架，SSR/SSG | [文档](https://nextjs.org/docs) |
| **TypeScript** | 5.x | 类型安全 | [文档](https://www.typescriptlang.org/docs) |
| **TailwindCSS** | 3.x | 样式框架 | [文档](https://tailwindcss.com/docs) |
| **Wagmi** | 2.x | 以太坊 React Hooks | [文档](https://wagmi.sh) |
| **Viem** | 2.x | 以太坊客户端 | [文档](https://viem.sh) |
| **WalletConnect** | 2.x | 钱包连接协议 | [文档](https://docs.walletconnect.com) |

### 开发工具

| 工具 | 用途 |
|------|------|
| **ESLint** | 代码检查 |
| **Prettier** | 代码格式化 |
| **Husky** | Git Hooks |
| **Hardhat** | 智能合约开发 |
| **Jest** | 单元测试 |
| **Cypress** | E2E 测试 |

## 📁 目录结构

```
monad-gaming/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css         # 全局样式
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页
│   │   ├── pay/                # 支付页面
│   │   ├── test-deeplink/      # 深度链接测试
│   │   └── test-monad/         # Monad 测试
│   ├── components/             # React 组件
│   │   ├── AdvancedLinkGenerator.tsx    # 高级链接生成器
│   │   ├── QRCodeDisplay.tsx            # 二维码显示
│   │   ├── WalletConnectDeepLink.tsx    # WalletConnect 深度链接
│   │   ├── MobileWalletSelector.tsx     # 移动端钱包选择器
│   │   └── ...
│   ├── config/                 # 配置文件
│   │   └── contracts.ts        # 合约配置
│   ├── lib/                    # 库文件
│   │   └── wagmi.ts           # Wagmi 配置
│   ├── utils/                  # 工具函数
│   │   ├── walletDetection.ts  # 钱包检测
│   │   ├── abiParser.ts        # ABI 解析
│   │   └── ...
│   └── types/                  # TypeScript 类型定义
├── contracts/                  # 智能合约
│   └── MonadPay.sol           # 主合约
├── scripts/                    # 部署脚本
│   └── deploy-monad.js        # Monad 部署脚本
├── public/                     # 静态资源
├── docs/                       # 文档文件
└── tests/                      # 测试文件
```

## 🧩 核心组件

### 1. AdvancedLinkGenerator

**功能：** 高级支付链接生成器

**主要特性：**
- 支持多种支付类型（基础、托管、多签等）
- 表单验证和错误处理
- 实时链接预览

**使用示例：**
```tsx
import { AdvancedLinkGenerator } from '@/components/AdvancedLinkGenerator';

function PaymentPage() {
  return (
    <div>
      <AdvancedLinkGenerator 
        onLinkGenerated={(link) => console.log(link)}
        defaultValues={{ token: 'USDC' }}
      />
    </div>
  );
}
```

### 2. WalletConnectDeepLink

**功能：** WalletConnect 深度链接处理

**主要特性：**
- WalletConnect URI 格式支持
- 多钱包深度链接生成
- 智能回退机制
- NFC 数据生成

**核心接口：**
```typescript
interface WalletConnectDeepLinkProps {
  paymentUrl: string;
  onWalletOpen?: (wallet: string) => void;
  onError?: (error: Error) => void;
  enableNFC?: boolean;
}
```

### 3. MobileWalletSelector

**功能：** 移动端钱包选择器

**主要特性：**
- 自动检测已安装钱包
- 移动端优化界面
- 钱包推荐和下载引导

**状态管理：**
```typescript
interface WalletStatus {
  wallet: WalletInfo;
  detection: WalletDetectionResult;
}
```

### 4. QRCodeDisplay

**功能：** 二维码生成和显示

**主要特性：**
- 动态二维码生成
- 链接复制和分享
- 错误处理和重试

### 5. 钱包检测工具 (walletDetection.ts)

**功能：** 智能钱包检测和管理

**核心函数：**
```typescript
// 检测钱包安装状态
function detectWalletInstallation(walletId: string): Promise<WalletDetectionResult>

// 生成钱包深度链接
function generateWalletDeepLink(walletId: string, params: DeepLinkParams): string

// 打开钱包（带回退）
function openWalletWithFallback(deepLink: string, fallbackUrl: string): Promise<void>

// 获取推荐钱包
function getRecommendedWallets(platform?: Platform): WalletInfo[]
```

## 🔄 开发工作流

### 1. 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-wallet-support

# 2. 开发功能
npm run dev

# 3. 运行测试
npm run test
npm run test:e2e

# 4. 代码检查
npm run lint
npm run type-check

# 5. 提交代码
git add .
git commit -m "feat: add new wallet support"

# 6. 推送和创建 PR
git push origin feature/new-wallet-support
```

### 2. 组件开发模式

```bash
# 启动 Storybook（如果配置）
npm run storybook

# 组件隔离开发
npm run dev:component ComponentName
```

### 3. 智能合约开发

```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到本地网络
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# 部署到测试网
npx hardhat run scripts/deploy-monad.js --network monadTestnet
```

## 📏 代码规范

### TypeScript 规范

```typescript
// ✅ 好的实践
interface PaymentParams {
  to: string;
  amount: string;
  token?: string;
}

const generatePayment = async (params: PaymentParams): Promise<string> => {
  // 实现逻辑
};

// ❌ 避免的写法
const generatePayment = (to: any, amount: any, token?: any) => {
  // 缺少类型定义
};
```

### React 组件规范

```tsx
// ✅ 好的组件结构
interface WalletButtonProps {
  walletId: string;
  onConnect: (wallet: string) => void;
  disabled?: boolean;
}

export const WalletButton: React.FC<WalletButtonProps> = ({
  walletId,
  onConnect,
  disabled = false
}) => {
  const handleClick = useCallback(() => {
    onConnect(walletId);
  }, [walletId, onConnect]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="wallet-button"
    >
      Connect {walletId}
    </button>
  );
};
```

### 样式规范

```tsx
// ✅ 使用 Tailwind 类名
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <span className="text-lg font-semibold text-gray-900">Payment</span>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Pay Now
  </button>
</div>

// ✅ 自定义样式（必要时）
<div className="payment-card">
  {/* 内容 */}
</div>

/* globals.css */
.payment-card {
  @apply flex items-center justify-between p-4 bg-white rounded-lg shadow-md;
}
```

### 错误处理规范

```typescript
// ✅ 统一错误处理
class MonadPayError extends Error {
  constructor(
    public type: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MonadPayError';
  }
}

// 使用示例
try {
  const result = await generatePaymentLink(params);
  return result;
} catch (error) {
  if (error instanceof MonadPayError) {
    console.error(`${error.type}: ${error.message}`, error.details);
  }
  throw error;
}
```

## 🧪 测试指南

### 单元测试

```typescript
// utils/walletDetection.test.ts
import { detectWalletInstallation } from './walletDetection';

describe('walletDetection', () => {
  test('should detect MetaMask installation', async () => {
    // Mock window.ethereum
    (global as any).window = {
      ethereum: { isMetaMask: true }
    };

    const result = await detectWalletInstallation('metamask');
    expect(result.installed).toBe(true);
  });

  test('should handle wallet not installed', async () => {
    (global as any).window = {};

    const result = await detectWalletInstallation('metamask');
    expect(result.installed).toBe(false);
    expect(result.fallbackLink).toBeDefined();
  });
});
```

### 组件测试

```tsx
// components/WalletButton.test.tsx
import { render, fireEvent, screen } from '@testing-library/react';
import { WalletButton } from './WalletButton';

describe('WalletButton', () => {
  test('should call onConnect when clicked', () => {
    const mockOnConnect = jest.fn();
    
    render(
      <WalletButton 
        walletId="metamask" 
        onConnect={mockOnConnect} 
      />
    );

    fireEvent.click(screen.getByText('Connect metamask'));
    expect(mockOnConnect).toHaveBeenCalledWith('metamask');
  });
});
```

### E2E 测试

```typescript
// cypress/e2e/payment-flow.cy.ts
describe('Payment Flow', () => {
  it('should generate payment link and display QR code', () => {
    cy.visit('/');
    
    // 填写支付信息
    cy.get('[data-testid="recipient-address"]')
      .type('0x742d35Cc6634C0532925a3b8D4C9db96590c6C87');
    cy.get('[data-testid="amount-input"]').type('10');
    cy.get('[data-testid="token-select"]').select('USDC');
    
    // 生成链接
    cy.get('[data-testid="generate-button"]').click();
    
    // 验证结果
    cy.get('[data-testid="qr-code"]').should('be.visible');
    cy.get('[data-testid="payment-link"]').should('contain', 'monadpay://');
  });
});
```

## ⚡ 性能优化

### 代码分割

```tsx
// 动态导入大型组件
const AdvancedLinkGenerator = dynamic(
  () => import('./AdvancedLinkGenerator'),
  { 
    loading: () => <div>Loading...</div>,
    ssr: false // 如果不需要 SSR
  }
);
```

### 状态管理优化

```tsx
// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(props.data);
}, [props.data]);

// 使用 useCallback 缓存函数
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

### 图片优化

```tsx
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src="/wallet-icons/metamask.png"
  alt="MetaMask"
  width={32}
  height={32}
  priority // 关键图片
/>
```

## 🎯 最佳实践

### 1. 组件设计原则

- **单一职责**：每个组件只负责一个功能
- **可复用性**：设计通用的、可配置的组件
- **可测试性**：组件应该易于测试
- **可访问性**：遵循 WCAG 无障碍标准

### 2. 状态管理

```tsx
// ✅ 使用 Context 管理全局状态
const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const value = {
    connectedWallet,
    isConnecting,
    connect: async (walletId: string) => {
      setIsConnecting(true);
      try {
        await connectWallet(walletId);
        setConnectedWallet(walletId);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
```

### 3. 错误边界

```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4. 环境配置

```typescript
// config/env.ts
const config = {
  reownProjectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
  monadRpcUrl: process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// 验证必需的环境变量
if (!config.reownProjectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is required');
}

export default config;
```

### 5. 安全实践

```typescript
// 输入验证
const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1e18;
};

// 敏感数据处理
const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // 只允许特定协议
    if (!['http:', 'https:', 'monadpay:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL');
  }
};
```

## 🔍 调试技巧

### 1. 开发工具

```typescript
// 开发环境调试
if (process.env.NODE_ENV === 'development') {
  console.log('Wallet detection result:', walletStatus);
  console.log('Generated deep link:', deepLink);
}

// 使用 React DevTools Profiler
const ProfiledComponent = React.memo(ExpensiveComponent);
```

### 2. 网络调试

```typescript
// 网络请求拦截
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch request:', args);
  const response = await originalFetch(...args);
  console.log('Fetch response:', response);
  return response;
};
```

### 3. 钱包连接调试

```typescript
// 钱包事件监听
if (window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    console.log('Accounts changed:', accounts);
  });
  
  window.ethereum.on('chainChanged', (chainId: string) => {
    console.log('Chain changed:', chainId);
  });
}
```

## 📚 学习资源

### 官方文档
- [Next.js 文档](https://nextjs.org/docs)
- [Wagmi 文档](https://wagmi.sh)
- [WalletConnect 文档](https://docs.walletconnect.com)
- [Monad 文档](https://docs.monad.xyz)

### 社区资源
- [Ethereum 开发者资源](https://ethereum.org/developers)
- [Web3 开发最佳实践](https://web3.guide)
- [DApp 安全指南](https://consensys.github.io/smart-contract-best-practices)

---

**祝你开发愉快！** 🚀

**最后更新：** 2024年1月  
**文档版本：** 1.0