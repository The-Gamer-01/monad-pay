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
        className="bg-yellow-500 text-white px-4 py-2 rounded-lg cursor-not-allowed font-medium"
      >
        连接中...
      </button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg font-medium">
          {formatAddress(address)}
        </div>
        <button
          onClick={handleDisconnect}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
        >
          断开连接
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
    >
      连接钱包
    </button>
  )
}