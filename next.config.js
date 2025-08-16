/** @type {import('next').NextConfig} */
const nextConfig = {
  // 只在构建时启用静态导出
  ...(process.env.NODE_ENV === 'production' && process.env.STATIC_EXPORT === 'true' ? {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
  } : {}),
  images: {
    unoptimized: true, // 静态导出需要
  },
  // 基础路径配置（用于 GitHub Pages 等）
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

module.exports = nextConfig