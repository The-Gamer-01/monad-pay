/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // 支持静态导出
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true, // 静态导出需要
  },
  // 基础路径配置（用于 GitHub Pages 等）
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

module.exports = nextConfig