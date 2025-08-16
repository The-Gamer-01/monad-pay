/** @type {import('next').NextConfig} */
const nextConfig = {
  // 默认静态导出，适合多种部署平台
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // 静态导出需要
  },
  // 基础路径配置（用于 GitHub Pages 等）
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // 确保兼容性
  distDir: 'out',
}

module.exports = nextConfig