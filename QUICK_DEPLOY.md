# 🚀 MonadPay 黑客松快速部署指南

## 最快部署方式 (5分钟内)

### 方案1: Vercel 部署 (推荐) ⭐

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **一键部署到 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "Import Project"
   - 选择你的 GitHub 仓库
   - 设置环境变量（可选）：`NEXT_PUBLIC_REOWN_PROJECT_ID`
   - 点击 "Deploy"

   **或者使用命令行：**
   ```bash
   npx vercel --prod
   ```

### 方案2: Netlify 部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **部署到 Netlify**
   ```bash
   npx netlify deploy --prod --dir=.next
   ```

### 方案3: GitHub Pages (静态部署)

1. **导出静态文件**
   ```bash
   NEXT_OUTPUT=export npm run build
   ```

2. **推送到 gh-pages 分支**
   ```bash
   npx gh-pages -d out
   ```

## 一键部署脚本

运行快速部署脚本：
```bash
chmod +x deploy.sh
./deploy.sh
```

## 环境变量配置 (可选)

创建 `.env.local` 文件：
```env
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
```

获取 Project ID：
1. 访问 [Reown Cloud](https://cloud.reown.com)
2. 创建项目并复制 ID

## 快速测试

部署完成后，访问你的网站：
1. 生成支付链接
2. 扫描二维码测试
3. 测试钱包连接功能

## 故障排除

**构建失败？**
- 确保 Node.js 版本 >= 18
- 运行 `npm install` 重新安装依赖

**钱包连接失败？**
- 检查 HTTPS 连接（本地开发可忽略）
- 确认 Reown Project ID 配置正确

**页面空白？**
- 检查浏览器控制台错误
- 确认静态资源路径正确

## 演示链接

部署成功后，你可以分享以下测试链接：
- 主页：`https://your-domain.com/`
- 支付测试：`https://your-domain.com/pay?to=0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e4c&amount=10&token=MON`
- 深度链接测试：`https://your-domain.com/test-deeplink`

---

**🎯 黑客松提示：**
- Vercel 部署最快，支持自动 HTTPS
- 记得在演示时准备好测试钱包
- 可以使用 Monad 测试网进行演示