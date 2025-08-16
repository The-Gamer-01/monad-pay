/** @type {import('next').NextConfig} */
const nextConfig = {
  // 只在静态导出时启用特殊配置（用于 GitHub Pages 等）
  ...(process.env.STATIC_EXPORT === 'true' ? {
    output: 'export',
    trailingSlash: true,
    distDir: 'dist',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  } : {}),
  images: {
    unoptimized: true, // 静态导出需要
  },
}

module.exports = nextConfig