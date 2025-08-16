'use client'

import { useState, useEffect } from 'react'
import LinkGenerator from '../../components/LinkGenerator'
import QRCodeDisplay from '../../components/QRCodeDisplay'

export default function TestDeeplink() {
  const [generatedLink, setGeneratedLink] = useState<string>('')

  const [testLinks, setTestLinks] = useState<Array<{name: string, link: string}>>([])

  // 在客户端设置测试链接
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTestLinks([
        {
          name: 'MON 测试支付',
          link: `${window.location.origin}/pay?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=1&token=MON&label=测试支付&message=这是一个MON测试支付`
        },
        {
          name: 'ETH 小额支付',
          link: `${window.location.origin}/pay?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=0.01&token=ETH&label=小额支付`
        }
      ])
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            🔗 深度链接测试
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            测试 MonadPay 深度链接功能，验证各种钱包的兼容性
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* 预设测试链接 */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              📋 预设测试链接
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {testLinks.map((test, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">
                    {test.name}
                  </h3>
                  <QRCodeDisplay link={test.link} />
                </div>
              ))}
            </div>
          </div>

          {/* 自定义链接生成 */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              ⚙️ 自定义链接生成
            </h2>
            <LinkGenerator onLinkGenerated={setGeneratedLink} />
            {generatedLink && (
              <div className="mt-4 sm:mt-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">
                  测试结果
                </h3>
                <QRCodeDisplay link={generatedLink} />
              </div>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 sm:mt-8 bg-blue-50 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-3 sm:mb-4">
            📖 使用说明
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">
                📱 移动端测试
              </h3>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                <li>• 扫描二维码或点击"在钱包中打开"</li>
                <li>• 系统会尝试打开 MetaMask</li>
                <li>• 如果失败，会提供其他钱包选项</li>
                <li>• 支持 Trust Wallet、Rainbow 等</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">
                💻 桌面端测试
              </h3>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                <li>• 点击"在钱包中打开"直接跳转</li>
                <li>• 或复制链接到浏览器</li>
                <li>• 确保已安装钱包扩展</li>
                <li>• 支持 MetaMask、Coinbase Wallet 等</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}