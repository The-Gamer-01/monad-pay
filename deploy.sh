#!/bin/bash

# MonadPay 快速部署脚本
# 适用于黑客松快速部署

echo "🚀 MonadPay 快速部署开始..."

# 检查 Node.js 版本
echo "📋 检查环境..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt "18" ]; then
    echo "❌ 需要 Node.js 18 或更高版本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

echo "✅ 构建完成！"
echo ""
echo "🎯 部署选项："
echo "1. Vercel (推荐): npx vercel --prod"
echo "2. Netlify: npx netlify deploy --prod --dir=out"
echo "3. 本地预览: npm start"
echo ""
echo "📝 注意事项："
echo "- 确保设置环境变量 NEXT_PUBLIC_REOWN_PROJECT_ID"
echo "- 对于静态部署，请运行: npm run export"
echo ""
echo "🔗 有用的链接："
echo "- Vercel: https://vercel.com"
echo "- Netlify: https://netlify.com"
echo "- GitHub Pages: 需要静态导出"