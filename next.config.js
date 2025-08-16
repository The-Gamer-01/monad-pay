/** @type {import('next').NextConfig} */
const nextConfig = {
  // 只在静态导出时启用特殊配置
  ...(process.env.STATIC_EXPORT === 'true' ? {
    output: 'export',
    trailingSlash: true,
    distDir: 'dist',
  } : {}),
  images: {
    unoptimized: true, // 静态导出需要
  },
  // 基础路径配置（用于 GitHub Pages 等）
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

module.exports = nextConfig