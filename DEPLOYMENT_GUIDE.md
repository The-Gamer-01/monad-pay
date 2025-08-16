# 📚 MonadPay 完整部署指南

本指南整合了所有部署相关的信息，提供从开发到生产的完整部署流程。

## 📋 目录

- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [本地开发](#本地开发)
- [构建项目](#构建项目)
- [部署选项](#部署选项)
- [智能合约部署](#智能合约部署)
- [故障排除](#故障排除)
- [安全检查](#安全检查)

## 🚀 快速开始

### 最快部署方式（5分钟内）

**选项1：Vercel 一键部署** ⭐
```bash
# 推送到 GitHub
git add .
git commit -m "Ready for deployment"
git push

# 部署到 Vercel
npx vercel --prod
```

**选项2：Netlify 拖拽部署**
```bash
# 构建项目
npm run build

# 访问 netlify.com，拖拽 dist/ 文件夹
```

**选项3：一键部署脚本**
```bash
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ 环境配置

### 环境要求

- **Node.js**: 18+ 
- **npm**: 8+ 或 **yarn**: 1.22+
- **Git**: 最新版本
- **Reown Cloud 账户**（用于获取 Project ID）

### 环境变量设置

创建 `.env.local` 文件：

```env
# 必需配置
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id_here

# 智能合约部署（可选）
PRIVATE_KEY=your_private_key_here
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
FEE_RECIPIENT=your_fee_recipient_address

# 可选配置
GAS_PRICE=1000000000
GAS_LIMIT=8000000
MONAD_API_KEY=your_monad_api_key
```

### 获取 Reown Project ID

1. 访问 [Reown Cloud](https://cloud.reown.com)
2. 创建新项目
3. 复制 Project ID
4. 添加到环境变量中

## 💻 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/your-username/monad-gaming.git
cd monad-gaming
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 配置环境

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
vim .env.local  # 或使用你喜欢的编辑器
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 开始开发！

## 🔨 构建项目

### 标准构建

```bash
# Next.js 标准构建
npm run build

# 启动生产服务器
npm start
```

### 静态导出构建

```bash
# 静态导出构建（用于静态托管）
npm run build

# 构建文件将在 dist/ 目录中
```

### 本地预览

```bash
# 使用 serve
npx serve dist

# 使用 Python
cd dist && python -m http.server 8000

# 使用 PHP
cd dist && php -S localhost:8000
```

## 🌐 部署选项

### 1. Vercel 部署（推荐）⭐

**自动部署：**
1. 连接 GitHub 仓库到 Vercel
2. 设置环境变量
3. 自动部署

**手动部署：**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

**构建设置：**
- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 2. Netlify 部署

**方法1：拖拽部署**
1. 运行 `npm run build`
2. 访问 [netlify.com](https://netlify.com)
3. 拖拽 `dist/` 文件夹

**方法2：Git 集成**
- Build command: `npm run build`
- Publish directory: `dist`

**方法3：CLI 部署**
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署
netlify deploy --prod --dir=dist
```

### 3. Firebase Hosting

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 初始化项目
firebase init hosting

# 部署
firebase deploy
```

### 4. GitHub Pages

```bash
# 安装 gh-pages
npm install -g gh-pages

# 构建并部署
npm run build
npx gh-pages -d out
```

### 5. Surge.sh

```bash
# 安装 surge
npm install -g surge

# 部署
cd dist && surge
```

### 6. 自定义服务器

```bash
# 使用 PM2
npm install -g pm2
npm run build
pm2 start npm --name "monadpay" -- start

# 使用 Docker
docker build -t monadpay .
docker run -p 3000:3000 monadpay
```

## 🔗 智能合约部署

### 准备工作

1. **获取测试代币**
   - 访问 [Monad 测试网水龙头](https://faucet.monad.xyz)
   - 输入钱包地址获取测试代币

2. **安装 Hardhat 依赖**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
   ```

### 部署到测试网

```bash
# 编译合约
npx hardhat compile

# 部署到 Monad 测试网
npx hardhat run scripts/deploy-monad.js --network monadTestnet
```

### 部署到主网

```bash
# ⚠️ 谨慎操作，确保充分测试
npx hardhat run scripts/deploy-monad.js --network monadMainnet
```

### 验证合约

```bash
# 验证合约（如果支持）
npx hardhat verify --network monadTestnet CONTRACT_ADDRESS
```

### 更新前端配置

部署成功后，更新 `src/config/contracts.ts`：

```typescript
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

## 🔧 故障排除

### 常见构建错误

**1. Node.js 版本不兼容**
```bash
# 检查版本
node --version
npm --version

# 升级 Node.js
nvm install 18
nvm use 18
```

**2. 依赖安装失败**
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**3. 构建内存不足**
```bash
# 增加内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 常见部署错误

**1. 环境变量未设置**
- 检查 `.env.local` 文件
- 确认部署平台环境变量配置

**2. 静态资源路径错误**
- 检查 `next.config.js` 配置
- 确认 `basePath` 和 `assetPrefix` 设置

**3. HTTPS 证书问题**
- 使用 HTTPS 部署
- 检查域名配置

### 智能合约部署错误

**1. Gas 费用不足**
```bash
# 检查账户余额
npx hardhat run scripts/check-balance.js --network monadTestnet
```

**2. 网络连接问题**
```bash
# 测试 RPC 连接
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://testnet-rpc.monad.xyz
```

**3. 私钥格式错误**
- 确保私钥以 `0x` 开头
- 检查私钥长度（64个字符）

## 🛡️ 安全检查清单

### 部署前检查

- [ ] 环境变量正确配置
- [ ] 私钥安全存储（未提交到代码库）
- [ ] HTTPS 证书配置
- [ ] 域名和 CORS 设置
- [ ] 错误页面配置

### 智能合约安全

- [ ] 合约代码审计
- [ ] 测试网充分测试
- [ ] Gas 限制合理设置
- [ ] 费用接收地址正确
- [ ] 合约参数验证

### 生产环境安全

- [ ] 启用 HTTPS
- [ ] 设置安全头
- [ ] 配置 CSP 策略
- [ ] 启用访问日志
- [ ] 设置监控告警

## 📊 性能优化

### 构建优化

```javascript
// next.config.js
module.exports = {
  // 启用压缩
  compress: true,
  
  // 图片优化
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 代码分割
  experimental: {
    esmExternals: true,
  },
};
```

### 部署优化

- **CDN 配置**：使用 CDN 加速静态资源
- **缓存策略**：设置合理的缓存头
- **压缩启用**：启用 Gzip/Brotli 压缩
- **预加载**：关键资源预加载

## 📈 监控和维护

### 推荐监控服务

- **错误监控**: [Sentry](https://sentry.io)
- **性能监控**: [Vercel Analytics](https://vercel.com/analytics)
- **用户分析**: [Google Analytics](https://analytics.google.com)
- **正常运行时间**: [UptimeRobot](https://uptimerobot.com)

### 维护任务

- **定期更新**：依赖包和安全补丁
- **备份数据**：部署配置和环境变量
- **性能检查**：定期性能测试
- **安全审计**：定期安全检查

## 🎯 部署最佳实践

### 开发流程

1. **本地开发** → 功能开发和测试
2. **测试环境** → 集成测试和 QA
3. **预生产环境** → 最终验证
4. **生产环境** → 正式发布

### CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 版本管理

```bash
# 语义化版本
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0

# 发布标签
git tag v1.0.0
git push origin v1.0.0
```

## 📞 获取帮助

如果遇到部署问题：

1. **查看文档**：检查相关章节
2. **检查日志**：查看构建和运行日志
3. **社区支持**：
   - [GitHub Issues](https://github.com/your-repo/issues)
   - [Discord 社区](https://discord.gg/monad)
   - [开发者论坛](https://forum.monad.xyz)
4. **专业支持**：联系技术支持团队

---

**祝你部署成功！** 🚀

**最后更新：** 2024年1月  
**文档版本：** 1.0