import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import WagmiProviderWrapper from '../components/WagmiProvider'
import WalletConnect from '../components/WalletConnect'

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
        <WagmiProviderWrapper>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header - 移动端优化 */}
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4 sm:py-6">
                  <div className="flex items-center">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">💰 MonadPay</h1>
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Beta
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 sm:space-x-8">
                    <nav className="hidden md:flex space-x-8">
                      <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">🔗 生成链接</a>
                      <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">📚 文档</a>
                      <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">🎯 演示</a>
                    </nav>
                    {/* 移动端菜单按钮 */}
                    <div className="md:hidden">
                      <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                    <WalletConnect />
                  </div>
                </div>
              </div>
            </header>
            {/* Main Content - 移动端优化 */}
            <main className="pb-16 md:pb-0">{children}</main>
            
            {/* 移动端底部导航 */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
              <div className="flex justify-around items-center">
                <a href="#" className="flex flex-col items-center py-2 px-3 text-xs text-gray-600 hover:text-gray-900 transition-colors touch-manipulation">
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>生成链接</span>
                </a>
                <a href="#" className="flex flex-col items-center py-2 px-3 text-xs text-gray-600 hover:text-gray-900 transition-colors touch-manipulation">
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>文档</span>
                </a>
                <a href="#" className="flex flex-col items-center py-2 px-3 text-xs text-gray-600 hover:text-gray-900 transition-colors touch-manipulation">
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span>演示</span>
                </a>
              </div>
            </nav>
          </div>
           <footer className="bg-white border-t mt-20">
             <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
               <div className="text-center text-gray-500">
                 <p className="text-sm">&copy; 2024 MonadPay. 为 Monad 黑客松构建.</p>
               </div>
             </div>
           </footer>
         </WagmiProviderWrapper>
       </body>
     </html>
  )
}