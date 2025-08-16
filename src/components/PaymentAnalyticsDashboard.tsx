'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

interface PaymentStats {
  totalPayments: number
  totalVolume: string
  successRate: number
  averageAmount: string
  paymentsByType: {
    regular: number
    escrow: number
    multisig: number
    conditional: number
    split: number
    nft: number
  }
  recentTransactions: {
    id: string
    type: string
    amount: string
    token: string
    status: 'completed' | 'pending' | 'failed'
    timestamp: number
  }[]
  volumeByMonth: {
    month: string
    volume: number
  }[]
}

interface PaymentAnalyticsDashboardProps {
  onClose?: () => void
}

export default function PaymentAnalyticsDashboard({ onClose }: PaymentAnalyticsDashboardProps) {
  const { address } = useAccount()
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  useEffect(() => {
    const mockStats: PaymentStats = {
      totalPayments: 156,
      totalVolume: '45,678.90',
      successRate: 94.2,
      averageAmount: '293.07',
      paymentsByType: {
        regular: 89,
        escrow: 23,
        multisig: 18,
        conditional: 12,
        split: 9,
        nft: 5,
      },
      recentTransactions: [
        {
          id: 'tx_001',
          type: 'escrow',
          amount: '500',
          token: 'MON',
          status: 'completed',
          timestamp: Date.now() - 3600000,
        },
        {
          id: 'tx_002',
          type: 'multisig',
          amount: '1200',
          token: 'USDC',
          status: 'pending',
          timestamp: Date.now() - 7200000,
        },
        {
          id: 'tx_003',
          type: 'regular',
          amount: '50',
          token: 'MON',
          status: 'completed',
          timestamp: Date.now() - 10800000,
        },
        {
          id: 'tx_004',
          type: 'split',
          amount: '800',
          token: 'ETH',
          status: 'failed',
          timestamp: Date.now() - 14400000,
        },
        {
          id: 'tx_005',
          type: 'nft',
          amount: '2.5',
          token: 'ETH',
          status: 'completed',
          timestamp: Date.now() - 18000000,
        },
      ],
      volumeByMonth: [
        { month: '1月', volume: 12500 },
        { month: '2月', volume: 18200 },
        { month: '3月', volume: 15800 },
        { month: '4月', volume: 22100 },
        { month: '5月', volume: 19600 },
        { month: '6月', volume: 25400 },
      ],
    }
    
    setTimeout(() => {
      setStats(mockStats)
      setLoading(false)
    }, 1000)
  }, [timeRange])

  const getStatusColor = (status: 'completed' | 'pending' | 'failed') => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: 'completed' | 'pending' | 'failed') => {
    switch (status) {
      case 'completed': return '已完成'
      case 'pending': return '进行中'
      case 'failed': return '失败'
      default: return '未知'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'regular': return '常规支付'
      case 'escrow': return '托管支付'
      case 'multisig': return '多签支付'
      case 'conditional': return '条件支付'
      case 'split': return '分割支付'
      case 'nft': return 'NFT支付'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'bg-blue-100 text-blue-800'
      case 'escrow': return 'bg-purple-100 text-purple-800'
      case 'multisig': return 'bg-indigo-100 text-indigo-800'
      case 'conditional': return 'bg-orange-100 text-orange-800'
      case 'split': return 'bg-teal-100 text-teal-800'
      case 'nft': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mb-8"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">支付分析仪表板</h2>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
            <option value="1y">最近1年</option>
          </select>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">总支付数</p>
              <p className="text-2xl font-bold">{stats.totalPayments}</p>
            </div>
            <div className="text-blue-200">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">总交易量</p>
              <p className="text-2xl font-bold">{stats.totalVolume} MON</p>
            </div>
            <div className="text-green-200">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">成功率</p>
              <p className="text-2xl font-bold">{stats.successRate}%</p>
            </div>
            <div className="text-purple-200">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">平均金额</p>
              <p className="text-2xl font-bold">{stats.averageAmount} MON</p>
            </div>
            <div className="text-orange-200">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 支付类型分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">支付类型分布</h3>
          <div className="space-y-3">
            {Object.entries(stats.paymentsByType).map(([type, count]) => {
              const percentage = (count / stats.totalPayments * 100).toFixed(1)
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(type)}`}>
                      {getTypeText(type)}
                    </span>
                    <span className="text-sm text-gray-600">{count} 笔</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">{percentage}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">月度交易量趋势</h3>
          <div className="space-y-2">
            {stats.volumeByMonth.map((item, index) => {
              const maxVolume = Math.max(...stats.volumeByMonth.map(v => v.volume))
              const percentage = (item.volume / maxVolume * 100)
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-8">{item.month}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">
                    {item.volume.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 最近交易 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近交易</h3>
        <div className="space-y-3">
          {stats.recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(tx.type)}`}>
                  {getTypeText(tx.type)}
                </span>
                <span className="font-mono text-sm text-gray-600">{tx.id}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-900">
                  {tx.amount} {tx.token}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(tx.status)}`}>
                  {getStatusText(tx.status)}
                </span>
                <span className="text-sm text-gray-500 w-20 text-right">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}