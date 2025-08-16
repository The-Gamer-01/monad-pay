# 🔧 MonadPay 故障排除指南

本指南提供常见问题的解决方案和调试技巧，帮助开发者快速定位和解决问题。

## 📋 目录

- [常见问题](#常见问题)
- [开发环境问题](#开发环境问题)
- [钱包连接问题](#钱包连接问题)
- [深度链接问题](#深度链接问题)
- [智能合约问题](#智能合约问题)
- [部署问题](#部署问题)
- [性能问题](#性能问题)
- [调试工具](#调试工具)
- [获取帮助](#获取帮助)

## ❓ 常见问题

### Q1: 项目启动失败

**症状：** `npm run dev` 命令执行失败

**可能原因：**
- Node.js 版本不兼容
- 依赖包安装不完整
- 端口被占用
- 环境变量缺失

**解决方案：**
```bash
# 1. 检查 Node.js 版本（需要 18.x 或更高）
node --version

# 2. 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 3. 检查端口占用
lsof -i :3000
# 如果被占用，杀死进程或使用其他端口
npm run dev -- -p 3001

# 4. 检查环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，填入必要的环境变量
```

### Q2: TypeScript 类型错误

**症状：** 编译时出现类型错误

**常见错误：**
```typescript
// 错误：Property 'ethereum' does not exist on type 'Window'
window.ethereum.request(...)

// 错误：Argument of type 'string' is not assignable to parameter of type 'Address'
const address: Address = userInput;
```

**解决方案：**
```typescript
// 1. 扩展 Window 接口
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 2. 使用类型断言
const address = userInput as `0x${string}`;

// 3. 添加类型检查
if (typeof userInput === 'string' && userInput.startsWith('0x')) {
  const address: Address = userInput as Address;
}
```

### Q3: 样式不生效

**症状：** Tailwind CSS 样式不显示

**解决方案：**
```bash
# 1. 检查 Tailwind 配置
cat tailwind.config.js

# 2. 确保 CSS 文件正确导入
# 在 app/globals.css 中应该有：
# @tailwind base;
# @tailwind components;
# @tailwind utilities;

# 3. 重新构建样式
npm run build

# 4. 清理缓存
rm -rf .next
npm run dev
```

## 🛠️ 开发环境问题

### 环境变量配置

**问题：** 环境变量未正确加载

**检查清单：**
```bash
# 1. 确认文件名正确
ls -la | grep env
# 应该看到 .env.local 或 .env

# 2. 检查变量格式
cat .env.local
# 格式应该是：NEXT_PUBLIC_VARIABLE_NAME=value
# 注意：客户端变量必须以 NEXT_PUBLIC_ 开头

# 3. 重启开发服务器
# 修改环境变量后必须重启
```

**常用环境变量：**
```bash
# .env.local
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=41454
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your_private_key  # 仅用于部署脚本
```

### 依赖冲突

**症状：** 包版本冲突或安装失败

**解决方案：**
```bash
# 1. 检查依赖冲突
npm ls

# 2. 使用 npm 的解决方案
npm install --legacy-peer-deps

# 3. 或者使用 yarn
yarn install

# 4. 强制重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 🔗 钱包连接问题

### MetaMask 连接失败

**症状：** 无法连接到 MetaMask 钱包

**诊断步骤：**
```javascript
// 1. 检查 MetaMask 是否安装
if (typeof window.ethereum === 'undefined') {
  console.error('MetaMask is not installed');
  // 引导用户安装
}

// 2. 检查网络连接
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
console.log('Current chain ID:', chainId);

// 3. 检查账户权限
const accounts = await window.ethereum.request({ method: 'eth_accounts' });
console.log('Connected accounts:', accounts);
```

**常见解决方案：**
```javascript
// 1. 请求连接权限
try {
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  console.log('Connected:', accounts[0]);
} catch (error) {
  if (error.code === 4001) {
    console.log('User rejected the request');
  } else {
    console.error('Error connecting:', error);
  }
}

// 2. 切换到正确网络
try {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0xa1f6' }], // Monad Testnet
  });
} catch (switchError) {
  // 如果网络不存在，添加网络
  if (switchError.code === 4902) {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0xa1f6',
        chainName: 'Monad Testnet',
        rpcUrls: ['https://testnet-rpc.monad.xyz'],
        nativeCurrency: {
          name: 'MON',
          symbol: 'MON',
          decimals: 18
        }
      }]
    });
  }
}
```

### WalletConnect 连接问题

**症状：** WalletConnect 二维码不显示或连接失败

**检查清单：**
```javascript
// 1. 验证 Project ID
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
if (!projectId) {
  console.error('Reown Project ID is missing');
}

// 2. 检查网络配置
const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    walletConnect({
      projectId,
      metadata: {
        name: 'MonadPay',
        description: 'Crypto payments via deep links',
        url: 'https://monadpay.com',
        icons: ['https://monadpay.com/icon.png']
      }
    })
  ],
  transports: {
    [monadTestnet.id]: http()
  }
});

// 3. 监听连接事件
config.subscribe(
  (state) => state.status,
  (status) => {
    console.log('Connection status:', status);
  }
);
```

## 🔗 深度链接问题

### 深度链接无法打开钱包

**症状：** 点击深度链接后钱包应用未打开

**诊断步骤：**
```javascript
// 1. 检查链接格式
const deepLink = 'metamask://wc?uri=wc:...';
console.log('Generated deep link:', deepLink);

// 2. 测试链接有效性
const testLink = (url) => {
  const link = document.createElement('a');
  link.href = url;
  link.click();
  
  // 设置回退机制
  setTimeout(() => {
    if (document.hidden) {
      console.log('App likely opened');
    } else {
      console.log('App did not open, showing fallback');
      // 显示下载链接或其他选项
    }
  }, 2000);
};
```

**移动端特殊处理：**
```javascript
// 移动端深度链接处理
const openMobileWallet = (walletId, wcUri) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    const deepLinks = {
      metamask: `metamask://wc?uri=${encodeURIComponent(wcUri)}`,
      rainbow: `rainbow://wc?uri=${encodeURIComponent(wcUri)}`,
      trust: `trust://wc?uri=${encodeURIComponent(wcUri)}`
    };
    
    const deepLink = deepLinks[walletId];
    if (deepLink) {
      window.location.href = deepLink;
      
      // 回退到应用商店
      setTimeout(() => {
        const storeLinks = {
          metamask: 'https://metamask.app.link/dapp/your-domain.com',
          rainbow: 'https://rainbow.me/download',
          trust: 'https://trustwallet.com/download'
        };
        window.location.href = storeLinks[walletId];
      }, 2500);
    }
  }
};
```

### NFC 功能问题

**症状：** NFC 写入失败或读取异常

**检查清单：**
```javascript
// 1. 检查浏览器支持
if ('NDEFReader' in window) {
  console.log('NFC is supported');
} else {
  console.log('NFC is not supported in this browser');
}

// 2. 检查权限
navigator.permissions.query({ name: 'nfc' }).then(result => {
  console.log('NFC permission:', result.state);
});

// 3. 错误处理
const writeNFC = async (data) => {
  try {
    const ndef = new NDEFReader();
    await ndef.write({
      records: [{
        recordType: "url",
        data: data
      }]
    });
    console.log('NFC write successful');
  } catch (error) {
    console.error('NFC write failed:', error);
    
    if (error.name === 'NotAllowedError') {
      alert('NFC access denied. Please enable NFC in browser settings.');
    } else if (error.name === 'NotSupportedError') {
      alert('NFC is not supported on this device.');
    }
  }
};
```

## 📜 智能合约问题

### 合约部署失败

**症状：** Hardhat 部署脚本执行失败

**常见错误和解决方案：**

```bash
# 错误：insufficient funds for gas
# 解决：检查账户余额
npx hardhat run scripts/check-balance.js --network monadTestnet

# 错误：nonce too low
# 解决：重置账户 nonce
npx hardhat run scripts/reset-nonce.js --network monadTestnet

# 错误：network not found
# 解决：检查 hardhat.config.js 网络配置
```

**调试脚本：**
```javascript
// scripts/debug-deployment.js
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
  
  const network = await ethers.provider.getNetwork();
  console.log('Network:', network.name, 'Chain ID:', network.chainId);
  
  const gasPrice = await ethers.provider.getGasPrice();
  console.log('Current gas price:', gasPrice.toString());
}

main().catch(console.error);
```

### 合约交互失败

**症状：** 前端无法调用合约方法

**检查步骤：**
```javascript
// 1. 验证合约地址
const contractAddress = '0x...';
const code = await provider.getCode(contractAddress);
if (code === '0x') {
  console.error('Contract not deployed at this address');
}

// 2. 检查 ABI 匹配
const contract = new ethers.Contract(contractAddress, abi, signer);
try {
  const result = await contract.someMethod();
  console.log('Contract call successful:', result);
} catch (error) {
  console.error('Contract call failed:', error);
  
  if (error.code === 'CALL_EXCEPTION') {
    console.log('Method does not exist or reverted');
  }
}

// 3. 检查网络匹配
const chainId = await signer.getChainId();
console.log('Signer chain ID:', chainId);
console.log('Expected chain ID:', 41454); // Monad Testnet
```

## 🚀 部署问题

### Vercel 部署失败

**常见问题：**

1. **构建失败**
```bash
# 本地测试构建
npm run build

# 检查构建输出
ls -la .next/
```

2. **环境变量缺失**
```bash
# 在 Vercel 控制台设置环境变量
# 或使用 Vercel CLI
vercel env add NEXT_PUBLIC_REOWN_PROJECT_ID
```

3. **函数超时**
```javascript
// vercel.json
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 静态部署问题

**症状：** 静态导出失败

**解决方案：**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // 禁用需要服务器的功能
  experimental: {
    appDir: true
  }
};

module.exports = nextConfig;
```

## ⚡ 性能问题

### 页面加载缓慢

**诊断工具：**
```javascript
// 性能监控
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});
observer.observe({ entryTypes: ['measure', 'navigation'] });

// 组件渲染时间
const ProfiledComponent = React.memo(function MyComponent(props) {
  const startTime = performance.now();
  
  useEffect(() => {
    const endTime = performance.now();
    console.log(`Component render time: ${endTime - startTime}ms`);
  });
  
  return <div>{/* component content */}</div>;
});
```

**优化建议：**
```javascript
// 1. 代码分割
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
});

// 2. 图片优化
import Image from 'next/image';

<Image
  src="/large-image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// 3. 缓存优化
const expensiveCalculation = useMemo(() => {
  return heavyComputation(data);
}, [data]);
```

### 内存泄漏

**检测方法：**
```javascript
// 监控内存使用
setInterval(() => {
  if (performance.memory) {
    console.log({
      used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
}, 5000);

// 清理事件监听器
useEffect(() => {
  const handleResize = () => {
    // 处理逻辑
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

## 🔍 调试工具

### 浏览器开发者工具

**Console 调试：**
```javascript
// 1. 分组日志
console.group('Wallet Connection');
console.log('Attempting to connect...');
console.log('Wallet ID:', walletId);
console.groupEnd();

// 2. 表格显示
console.table(walletList);

// 3. 性能标记
console.time('API Call');
// ... API 调用
console.timeEnd('API Call');

// 4. 条件日志
const DEBUG = process.env.NODE_ENV === 'development';
DEBUG && console.log('Debug info:', data);
```

**Network 面板：**
- 检查 API 请求状态
- 查看请求/响应头
- 监控加载时间

**Application 面板：**
- 检查 localStorage/sessionStorage
- 查看 Service Worker 状态
- 监控缓存使用

### React Developer Tools

```javascript
// 组件性能分析
function MyComponent() {
  // 使用 React DevTools Profiler
  return (
    <React.Profiler
      id="MyComponent"
      onRender={(id, phase, actualDuration) => {
        console.log(`${id} ${phase} took ${actualDuration}ms`);
      }}
    >
      <div>Component content</div>
    </React.Profiler>
  );
}
```

### 自定义调试工具

```javascript
// utils/debug.js
class DebugLogger {
  constructor(enabled = process.env.NODE_ENV === 'development') {
    this.enabled = enabled;
  }
  
  log(category, message, data = null) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      category,
      message,
      data
    };
    
    console.log(`[${timestamp}] ${category}: ${message}`, data || '');
    
    // 可选：发送到远程日志服务
    this.sendToRemote(logEntry);
  }
  
  error(category, error) {
    this.log(category, error.message, {
      stack: error.stack,
      name: error.name
    });
  }
  
  sendToRemote(logEntry) {
    // 实现远程日志收集
  }
}

const logger = new DebugLogger();
export default logger;

// 使用示例
import logger from '@/utils/debug';

logger.log('WALLET', 'Connection attempt', { walletId: 'metamask' });
logger.error('API', new Error('Request failed'));
```

## 📞 获取帮助

### 社区支持

- **GitHub Issues**: [项目 Issues 页面](https://github.com/your-repo/issues)
- **Discord**: [开发者社区](https://discord.gg/monad)
- **Telegram**: [技术支持群](https://t.me/monadpay)

### 官方文档

- [Next.js 故障排除](https://nextjs.org/docs/messages)
- [Wagmi 常见问题](https://wagmi.sh/react/guides/troubleshooting)
- [WalletConnect 调试指南](https://docs.walletconnect.com/2.0/web/guides/debugging)
- [Monad 开发者文档](https://docs.monad.xyz)

### 提交 Bug 报告

**Bug 报告模板：**
```markdown
## Bug 描述
简要描述遇到的问题

## 复现步骤
1. 打开页面
2. 点击连接钱包
3. 选择 MetaMask
4. 看到错误信息

## 预期行为
描述应该发生什么

## 实际行为
描述实际发生了什么

## 环境信息
- 操作系统: macOS 14.0
- 浏览器: Chrome 120.0
- Node.js: 18.17.0
- 项目版本: 1.0.0

## 错误日志
```
[粘贴相关的错误日志]
```

## 截图
如果适用，添加截图帮助解释问题
```

### 功能请求

**功能请求模板：**
```markdown
## 功能描述
简要描述希望添加的功能

## 使用场景
描述什么情况下需要这个功能

## 建议实现
如果有想法，描述如何实现这个功能

## 替代方案
描述考虑过的其他解决方案
```

---

**记住：** 遇到问题时，首先查看控制台错误信息，然后参考本指南的相关章节。如果问题仍未解决，请在社区寻求帮助或提交详细的 Bug 报告。

**最后更新：** 2024年1月  
**文档版本：** 1.0