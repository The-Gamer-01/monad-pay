'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAccount, useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'
import WalletConnect from '../../components/WalletConnect'
import NetworkSwitcher from '../../components/NetworkSwitcher'
import WalletBalance from '../../components/WalletBalance'

interface PaymentData {
  to: string
  amount: string
  token: string
  label?: string
  message?: string
  expires?: string
}

function PayPageContent() {
  const searchParams = useSearchParams()
  const { address, isConnected } = useAccount()
  const { sendTransaction, isPending, isSuccess, error } = useSendTransaction()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    // 解析URL参数
    const to = searchParams.get('to')
    const amount = searchParams.get('amount')
    const token = searchParams.get('token')
    const label = searchParams.get('label')
    const message = searchParams.get('message')
    const expires = searchParams.get('expires')

    if (to && amount && token) {
      const data: PaymentData = {
        to,
        amount,
        token,
        label: label || undefined,
        message: message || undefined,
        expires: expires || undefined
      }
      setPaymentData(data)

      // 检查是否过期
      if (expires) {
        const expiryTime = new Date(Number(expires) * 1000)
        if (expiryTime < new Date()) {
          setIsExpired(true)
        }
      }
    }
  }, [searchParams])

  const handlePayment = async () => {
    if (!paymentData || !isConnected) return

    try {
      // 这里简化处理，只支持ETH/MON原生代币
      // 实际应用中需要根据token类型调用不同的合约方法
      await sendTransaction({
        to: paymentData.to as `0x${string}`,
        value: parseEther(paymentData.amount)
      })
    } catch (err) {
      console.error('Payment failed:', err)
    }
  }

  if (!paymentData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-2">无效的支付链接</h1>
          <p className="text-red-700">请检查链接格式是否正确</p>
        </div>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-yellow-900 mb-2">支付链接已过期</h1>
          <p className="text-yellow-700">此支付链接已超过有效期</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">确认支付</h1>
        
        {/* 支付信息 */}
        <div className="space-y-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">支付详情</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">收款地址:</span>
                <span className="font-mono text-sm">{paymentData.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">金额:</span>
                <span className="font-semibold text-lg">{paymentData.amount} {paymentData.token}</span>
              </div>
              {paymentData.label && (
                <div className="flex justify-between">
                  <span className="text-gray-600">标签:</span>
                  <span>{paymentData.label}</span>
                </div>
              )}
              {paymentData.message && (
                <div className="flex justify-between">
                  <span className="text-gray-600">消息:</span>
                  <span>{paymentData.message}</span>
                </div>
              )}
              {paymentData.expires && (
                <div className="flex justify-between">
                  <span className="text-gray-600">过期时间:</span>
                  <span>{new Date(Number(paymentData.expires) * 1000).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 钱包连接和支付按钮 */}
        <div className="space-y-4">
          {!isConnected ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">请先连接钱包以继续支付</p>
              <WalletConnect />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-green-800">
                    钱包已连接: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                  <NetworkSwitcher />
                </div>
              </div>
              
              <WalletBalance />
              
              {isSuccess ? (
                <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                  <h3 className="text-green-800 font-semibold mb-2">支付成功!</h3>
                  <p className="text-green-700">交易已提交到区块链</p>
                </div>
              ) : (
                <button
                  onClick={handlePayment}
                  disabled={isPending}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
                    isPending
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
                >
                  {isPending ? '处理中...' : `支付 ${paymentData.amount} ${paymentData.token}`}
                </button>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-center">支付失败: {error.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <PayPageContent />
    </Suspense>
  )
}