'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { modal } from '../lib/wagmi'
import { useState, useEffect } from 'react'

export default function WalletConnect() {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleConnect = async () => {
    try {
      await modal.open()
    } catch (error) {
      console.error('连接钱包失败:', error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isClient) {
    return (
      <button
        disabled
        className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed font-medium"
      >
        加载中...
      </button>
    )
  }

  if (isConnecting) {
    return (
      <button
        disabled
        className="bg-gray-100 text-gray-400 px-4 py-3 sm:py-2 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2 text-base sm:text-sm touch-manipulation"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span>连接中...</span>
      </button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        <div className="flex items-center justify-center sm:justify-start space-x-2 bg-green-50 px-3 py-3 sm:py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm sm:text-sm text-green-700 font-medium">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-red-100 text-red-700 px-3 py-3 sm:py-2 rounded-lg hover:bg-red-200 transition-colors text-sm touch-manipulation"
        >
          断开连接
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-base sm:text-sm touch-manipulation"
    >
      🔗 连接钱包
    </button>
  )
}