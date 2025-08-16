import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import WagmiProviderWrapper from '@/components/WagmiProvider'
import WalletConnect from '@/components/WalletConnect'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MonadPay - 基于深度链接的加密支付',
  description: '发送、请求和触发加密支付的最简单方法--只需一个链接',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">MonadPay</h1>
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Beta
                  </span>
                </div>
                <div className="flex items-center space-x-8">
                  <nav className="hidden md:flex space-x-8">
                    <a href="#" className="text-gray-500 hover:text-gray-900">生成链接</a>
                    <a href="#" className="text-gray-500 hover:text-gray-900">文档</a>
                    <a href="#" className="text-gray-500 hover:text-gray-900">演示</a>
                  </nav>
                  <WalletConnect />
                </div>
              </div>
            </div>
          </header>
          <WagmiProviderWrapper>
            <main>{children}</main>
          </WagmiProviderWrapper>
          <footer className="bg-white border-t mt-20">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="text-center text-gray-500">
                <p>&copy; 2024 MonadPay. 为 Monad 黑客松构建.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}