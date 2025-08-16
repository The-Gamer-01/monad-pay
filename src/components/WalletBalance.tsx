'use client'

import { useAccount, useBalance } from 'wagmi'
import { useState, useEffect } from 'react'

export default function WalletBalance() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance, isLoading } = useBalance({
    address: address,
  })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || !isConnected || !address) {
    return null
  }

  const formatBalance = (value: string, decimals: number) => {
    const num = parseFloat(value)
    if (num === 0) return '0'
    if (num < 0.0001) return '< 0.0001'
    return num.toFixed(4)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">钱包余额</p>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-gray-400">加载中...</span>
            </div>
          ) : balance ? (
            <p className="text-lg font-semibold text-gray-900">
              {formatBalance(balance.formatted, balance.decimals)} {balance.symbol}
            </p>
          ) : (
            <p className="text-gray-400">无法获取余额</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{chain?.name}</p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-500">已连接</span>
          </div>
        </div>
      </div>
    </div>
  )
}