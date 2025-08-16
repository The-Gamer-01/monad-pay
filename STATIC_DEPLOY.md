# 🚀 MonadPay 静态部署指南

由于 Vercel 可能无法正确识别 Next.js 版本，我们已将项目配置为静态导出模式，支持多种部署平台。

## 📦 构建项目

```bash
npm run build
```

构建完成后，所有静态文件将在 `out/` 目录中。

## 🌐 部署选项

### 1. Netlify 部署（推荐）⭐

**方法 1：拖拽部署**
1. 运行 `npm run build`
2. 访问 [netlify.com](https://netlify.com)
3. 直接拖拽 `out/` 文件夹到部署区域

**方法 2：Git 集成**
1. 在 Netlify 连接你的 GitHub 仓库
2. 设置构建配置：
   - Build command: `npm run build`
   - Publish directory: `out`

### 2. Surge.sh 部署

```bash
# 安装 surge
npm install -g surge

# 部署
npm run deploy:surge
```

### 3. Firebase Hosting

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 初始化项目
firebase init hosting

# 部署
npm run deploy:firebase
```

### 4. GitHub Pages

```bash
# 安装 gh-pages
npm install -g gh-pages

# 构建并部署
npm run build
npx gh-pages -d out
```

### 5. Vercel 手动配置

如果仍想使用 Vercel，请手动设置：

**构建设置：**
- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: `out`
- Install Command: `npm install`

**环境变量：**
```
NEXT_PUBLIC_REOWN_PROJECT_ID=你的_Reown_项目_ID
```

## 🔧 本地预览

构建后可以本地预览：

```bash
# 使用 Python
cd out && python -m http.server 8000

# 使用 Node.js serve
npx serve out

# 使用 PHP
cd out && php -S localhost:8000
```

## 📱 测试链接

部署完成后，测试这些功能：

- 主页：`https://your-domain.com/`
- 支付链接：`https://your-domain.com/pay?to=0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e4c&amount=10&token=MON`
- 深度链接测试：`https://your-domain.com/test-deeplink`

## ⚡ 快速部署脚本

使用我们提供的一键部署脚本：

```bash
./deploy.sh
```

选择你喜欢的部署平台即可！

## 🎯 推荐部署顺序

1. **Netlify** - 最简单，拖拽即可
2. **Surge.sh** - 命令行快速部署
3. **Firebase** - Google 平台，稳定可靠
4. **GitHub Pages** - 免费，适合开源项目
5. **Vercel** - 手动配置后也很好用

所有方案都已测试通过，选择最适合你的即可！