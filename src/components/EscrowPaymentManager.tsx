'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'

interface EscrowPayment {
  id: string
  payer: string
  payee: string
  arbitrator: string
  amount: string
  token: string
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'refunded'
  timelock: number
  description: string
  createdAt: number
  disputeReason?: string
}

interface EscrowPaymentManagerProps {
  paymentId?: string
  onClose?: () => void
}

export default function EscrowPaymentManager({ paymentId, onClose }: EscrowPaymentManagerProps) {
  const { address } = useAccount()
  const [escrowPayments, setEscrowPayments] = useState<EscrowPayment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<EscrowPayment | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [showDispute, setShowDispute] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    const mockPayments: EscrowPayment[] = [
      {
        id: '1',
        payer: '0x1234...5678',
        payee: '0x8765...4321',
        arbitrator: '0xabcd...efgh',
        amount: '100',
        token: 'MON',
        status: 'funded',
        timelock: 24,
        description: '网站开发服务费用',
        createdAt: Date.now() - 86400000,
      },
      {
        id: '2',
        payer: '0x2345...6789',
        payee: '0x9876...5432',
        arbitrator: '0xbcde...fghi',
        amount: '50',
        token: 'USDC',
        status: 'disputed',
        timelock: 48,
        description: '设计稿交付',
        createdAt: Date.now() - 172800000,
        disputeReason: '交付的设计稿不符合要求',
      },
    ]
    setEscrowPayments(mockPayments)
    
    if (paymentId) {
      const payment = mockPayments.find(p => p.id === paymentId)
      if (payment) setSelectedPayment(payment)
    }
  }, [paymentId])

  const handleCompletePayment = async (payment: EscrowPayment) => {
    try {
      // Here would be the actual contract interaction
      console.log('Completing payment:', payment.id)
      
      // Update local state
      setEscrowPayments(prev => 
        prev.map(p => p.id === payment.id ? { ...p, status: 'completed' } : p)
      )
    } catch (error) {
      console.error('Error completing payment:', error)
    }
  }

  const handleRefundPayment = async (payment: EscrowPayment) => {
    try {
      console.log('Refunding payment:', payment.id)
      
      setEscrowPayments(prev => 
        prev.map(p => p.id === payment.id ? { ...p, status: 'refunded' } : p)
      )
    } catch (error) {
      console.error('Error refunding payment:', error)
    }
  }

  const handleRaiseDispute = async (payment: EscrowPayment) => {
    if (!disputeReason.trim()) return
    
    try {
      console.log('Raising dispute for payment:', payment.id, 'Reason:', disputeReason)
      
      setEscrowPayments(prev => 
        prev.map(p => p.id === payment.id ? { 
          ...p, 
          status: 'disputed',
          disputeReason 
        } : p)
      )
      
      setShowDispute(false)
      setDisputeReason('')
    } catch (error) {
      console.error('Error raising dispute:', error)
    }
  }

  const getStatusColor = (status: EscrowPayment['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'funded': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'disputed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: EscrowPayment['status']) => {
    switch (status) {
      case 'pending': return '等待资金'
      case 'funded': return '已托管'
      case 'completed': return '已完成'
      case 'disputed': return '争议中'
      case 'refunded': return '已退款'
      default: return '未知'
    }
  }

  if (selectedPayment) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">托管支付详情</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">支付ID</label>
              <p className="text-gray-900">{selectedPayment.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">状态</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                {getStatusText(selectedPayment.status)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">金额</label>
              <p className="text-gray-900">{selectedPayment.amount} {selectedPayment.token}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">托管期限</label>
              <p className="text-gray-900">{selectedPayment.timelock} 小时</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">付款方</label>
            <p className="text-gray-900 font-mono">{selectedPayment.payer}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">收款方</label>
            <p className="text-gray-900 font-mono">{selectedPayment.payee}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">仲裁人</label>
            <p className="text-gray-900 font-mono">{selectedPayment.arbitrator}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">描述</label>
            <p className="text-gray-900">{selectedPayment.description}</p>
          </div>

          {selectedPayment.disputeReason && (
            <div>
              <label className="block text-sm font-medium text-gray-700">争议原因</label>
              <p className="text-red-600">{selectedPayment.disputeReason}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {selectedPayment.status === 'funded' && address === selectedPayment.payee && (
              <button
                onClick={() => handleCompletePayment(selectedPayment)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                确认完成
              </button>
            )}
            
            {selectedPayment.status === 'funded' && address === selectedPayment.payer && (
              <button
                onClick={() => setShowDispute(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                提起争议
              </button>
            )}
            
            {selectedPayment.status === 'disputed' && address === selectedPayment.arbitrator && (
              <>
                <button
                  onClick={() => handleCompletePayment(selectedPayment)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  支持收款方
                </button>
                <button
                  onClick={() => handleRefundPayment(selectedPayment)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  支持付款方
                </button>
              </>
            )}
          </div>
        </div>

        {showDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">提起争议</h3>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="请描述争议原因..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleRaiseDispute(selectedPayment)}
                  disabled={!disputeReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交争议
                </button>
                <button
                  onClick={() => {
                    setShowDispute(false)
                    setDisputeReason('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">托管支付管理</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4">
        {escrowPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无托管支付记录
          </div>
        ) : (
          escrowPayments.map((payment) => (
            <div
              key={payment.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedPayment(payment)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">#{payment.id}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{payment.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{payment.amount} {payment.token}</span>
                    <span>•</span>
                    <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>付款方: {payment.payer.slice(0, 6)}...{payment.payer.slice(-4)}</div>
                  <div>收款方: {payment.payee.slice(0, 6)}...{payment.payee.slice(-4)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}