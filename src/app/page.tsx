'use client'

import { useState } from 'react'
import LinkGenerator from '@/components/LinkGenerator'
import QRCodeDisplay from '@/components/QRCodeDisplay'

export default function Home() {
  const [generatedLink, setGeneratedLink] = useState<string>('')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl mb-6">
          MonadPay
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          基于 Deeplinks 的规范，用于在 URL 中编码 Monad 交易请求。
          发送、请求和触发加密支付的最简单方法--只需一个链接。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
            <span className="text-sm text-gray-500">支持</span>
            <div className="font-semibold text-gray-900">MetaMask • Rabby • Rainbow</div>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
            <span className="text-sm text-gray-500">协议</span>
            <div className="font-semibold text-gray-900">WalletConnect • Monad</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Link Generator */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">生成支付链接</h2>
          <LinkGenerator onLinkGenerated={setGeneratedLink} />
        </div>

        {/* QR Code Display */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">二维码 & 预览</h2>
          <QRCodeDisplay link={generatedLink} />
        </div>
      </div>

      {/* Use Cases */}
      <div className="mt-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">使用场景</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">创作者收款</h3>
            <p className="text-gray-600 text-sm">在社交媒体分享支付链接，接受打赏和捐款</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6a2 2 0 002 2h4a2 2 0 002-2v-6M8 11h8" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">商家收款</h3>
            <p className="text-gray-600 text-sm">生成QR码用于线下支付，简化收款流程</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">NFC 支付</h3>
            <p className="text-gray-600 text-sm">将链接写入NFC芯片，实现一触即付</p>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">DApp 集成</h3>
            <p className="text-gray-600 text-sm">通过URL触发链上支付，无需开发钱包界面</p>
          </div>
        </div>
      </div>
    </div>
  )
}