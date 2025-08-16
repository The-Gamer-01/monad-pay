'use client'

import { useAccount, useBalance } from 'wagmi'
import WalletConnect from '../../components/WalletConnect'
import NetworkSwitcher from '../../components/NetworkSwitcher'
import WalletBalance from '../../components/WalletBalance'

export default function TestMonadPage() {
  const { address, isConnected, chain } = useAccount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Monad 测试网集成测试
          </h1>
          <p className="text-lg text-gray-600">
            测试 Monad 测试网的钱包连接和网络切换功能
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">钱包连接</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <WalletConnect />
            {isConnected && <NetworkSwitcher />}
          </div>
        </div>

        {isConnected && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">连接信息</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium text-gray-700 min-w-[120px]">钱包地址:</span>
                <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                  {address}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium text-gray-700 min-w-[120px]">当前网络:</span>
                <span className="text-gray-900">
                  {chain?.name} (Chain ID: {chain?.id})
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium text-gray-700 min-w-[120px]">网络类型:</span>
                <span className="text-gray-900">
                  {chain?.testnet ? '测试网' : '主网'}
                </span>
              </div>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">钱包余额</h2>
            <WalletBalance />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Monad 测试网信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">网络配置</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Chain ID:</strong> 10143</li>
                <li><strong>网络名称:</strong> Monad Testnet</li>
                <li><strong>原生代币:</strong> MON</li>
                <li><strong>RPC URL:</strong> https://testnet-rpc.monad.xyz</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">区块浏览器</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <a 
                    href="https://testnet.monadexplorer.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Monad Explorer
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}