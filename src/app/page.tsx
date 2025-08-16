'use client'

import { useState } from 'react'
import AdvancedLinkGenerator from '../components/AdvancedLinkGenerator'
import QRCodeDisplay from '../components/QRCodeDisplay'
import WalletConnect from '../components/WalletConnect'
import NetworkSwitcher from '../components/NetworkSwitcher'
import EscrowPaymentManager from '../components/EscrowPaymentManager'
import MultisigPaymentManager from '../components/MultisigPaymentManager'
import PaymentAnalyticsDashboard from '../components/PaymentAnalyticsDashboard'
import CustomContractPayment from '../components/CustomContractPayment'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import { DEPLOYMENT_INFO } from '../config/contracts'

export default function Home() {
  const [generatedLink, setGeneratedLink] = useState('')
  const [activeView, setActiveView] = useState<'generator' | 'escrow' | 'multisig' | 'contract' | 'analytics' | 'contract-analytics'>('generator')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
          MonadPay
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
          基于 Deeplinks 的规范，用于在 URL 中编码 Monad 交易请求。
          发送、请求和触发加密支付的最简单方法--只需一个链接。
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white px-4 py-3 rounded-lg shadow-sm border">
            <span className="text-sm text-gray-500 block">支持</span>
            <div className="font-semibold text-gray-900 text-sm sm:text-base">MetaMask • Rabby • Rainbow</div>
          </div>
          <div className="bg-white px-4 py-3 rounded-lg shadow-sm border">
            <span className="text-sm text-gray-500 block">协议</span>
            <div className="font-semibold text-gray-900 text-sm sm:text-base">WalletConnect • Monad</div>
          </div>
        </div>
        
        {/* 钱包连接 - 移动端优化 */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
          <WalletConnect />
          <NetworkSwitcher />
        </div>
        
        {/* 部署状态 */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  🎉 MonadPay 智能合约已成功部署到 Monad 测试网！
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>合约地址:</strong> <code className="bg-green-100 px-2 py-1 rounded text-xs">{DEPLOYMENT_INFO.MONAD_TESTNET.contractAddress}</code></p>
                  <p><strong>部署成本:</strong> {DEPLOYMENT_INFO.MONAD_TESTNET.deploymentCost}</p>
                  <p><strong>区块号:</strong> {DEPLOYMENT_INFO.MONAD_TESTNET.blockNumber}</p>
                  <div className="mt-2">
                    <a 
                      href={DEPLOYMENT_INFO.MONAD_TESTNET.explorerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-500 underline text-xs"
                    >
                      在区块浏览器中查看 →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-2xl p-2 shadow-lg border">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveView('generator')}
              className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${activeView === 'generator'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              支付链接生成
            </button>
            <button
              onClick={() => setActiveView('escrow')}
              className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${activeView === 'escrow'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              托管支付管理
            </button>
            <button
              onClick={() => setActiveView('multisig')}
              className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${activeView === 'multisig'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              多签支付管理
            </button>
            <button
              onClick={() => setActiveView('contract')}
              className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${activeView === 'contract'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              第三方合约
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${activeView === 'analytics'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              数据分析
            </button>
            <button
              onClick={() => setActiveView('contract-analytics')}
              className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${activeView === 'contract-analytics'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              合约分析
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - 移动端优化 */}
      {activeView === 'generator' && (
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Advanced Link Generator */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">可编程支付链接</h2>
            <AdvancedLinkGenerator onLinkGenerated={setGeneratedLink} />
          </div>

          {/* QR Code Display */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">二维码 & 预览</h2>
            <QRCodeDisplay link={generatedLink} />
          </div>
        </div>
      )}

      {activeView === 'escrow' && (
        <div className="max-w-4xl mx-auto">
          <EscrowPaymentManager />
        </div>
      )}

      {activeView === 'multisig' && (
        <div className="max-w-4xl mx-auto">
          <MultisigPaymentManager />
        </div>
      )}

      {activeView === 'contract' && (
        <div className="max-w-6xl mx-auto">
          <CustomContractPayment />
        </div>
      )}

      {activeView === 'contract-analytics' && (
        <div className="max-w-7xl mx-auto">
          <AnalyticsDashboard />
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="max-w-6xl mx-auto">
          <PaymentAnalyticsDashboard />
        </div>
      )}

      {/* Use Cases - 移动端优化 */}
      <div className="mt-12 sm:mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">使用场景</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="text-center p-4 sm:p-0">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">创作者收款</h3>
            <p className="text-gray-600 text-sm">在社交媒体分享支付链接，接受打赏和捐款</p>
          </div>
          <div className="text-center p-4 sm:p-0">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6a2 2 0 002 2h4a2 2 0 002-2v-6M8 11h8" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">商家收款</h3>
            <p className="text-gray-600 text-sm">生成QR码用于线下支付，简化收款流程</p>
          </div>
          <div className="text-center p-4 sm:p-0">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">NFC 支付</h3>
            <p className="text-gray-600 text-sm">将链接写入NFC芯片，实现一触即付</p>
          </div>
          <div className="text-center p-4 sm:p-0">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">DApp 集成</h3>
            <p className="text-gray-600 text-sm">通过URL触发链上支付，无需开发钱包界面</p>
          </div>
        </div>
      </div>
    </div>
  )
}