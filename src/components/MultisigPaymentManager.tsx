'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useWriteContract } from 'wagmi'

interface MultisigPayment {
  id: string
  creator: string
  signers: string[]
  threshold: number
  amount: string
  token: string
  recipient: string
  status: 'pending' | 'active' | 'executed' | 'cancelled'
  signatures: { signer: string; signed: boolean; timestamp?: number }[]
  description: string
  createdAt: number
  executedAt?: number
}

interface MultisigPaymentManagerProps {
  paymentId?: string
  onClose?: () => void
}

export default function MultisigPaymentManager({ paymentId, onClose }: MultisigPaymentManagerProps) {
  const { address } = useAccount()
  const [multisigPayments, setMultisigPayments] = useState<MultisigPayment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<MultisigPayment | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [actionType, setActionType] = useState<'sign' | 'execute' | 'cancel'>('sign')

  // Mock data for demonstration
  useEffect(() => {
    const mockPayments: MultisigPayment[] = [
      {
        id: '1',
        creator: '0x1234...5678',
        signers: ['0x1234...5678', '0x8765...4321', '0xabcd...efgh'],
        threshold: 2,
        amount: '1000',
        token: 'MON',
        recipient: '0x9999...0000',
        status: 'active',
        signatures: [
          { signer: '0x1234...5678', signed: true, timestamp: Date.now() - 3600000 },
          { signer: '0x8765...4321', signed: false },
          { signer: '0xabcd...efgh', signed: false },
        ],
        description: '团队资金分配',
        createdAt: Date.now() - 86400000,
      },
      {
        id: '2',
        creator: '0x2345...6789',
        signers: ['0x2345...6789', '0x9876...5432', '0xbcde...fghi'],
        threshold: 3,
        amount: '500',
        token: 'USDC',
        recipient: '0x8888...1111',
        status: 'executed',
        signatures: [
          { signer: '0x2345...6789', signed: true, timestamp: Date.now() - 7200000 },
          { signer: '0x9876...5432', signed: true, timestamp: Date.now() - 3600000 },
          { signer: '0xbcde...fghi', signed: true, timestamp: Date.now() - 1800000 },
        ],
        description: '供应商付款',
        createdAt: Date.now() - 172800000,
        executedAt: Date.now() - 1800000,
      },
    ]
    setMultisigPayments(mockPayments)
    
    if (paymentId) {
      const payment = mockPayments.find(p => p.id === paymentId)
      if (payment) setSelectedPayment(payment)
    }
  }, [paymentId])

  const handleSignPayment = async (payment: MultisigPayment) => {
    if (!address) return
    
    try {
      console.log('Signing payment:', payment.id)
      
      // Update local state
      setMultisigPayments(prev => 
        prev.map(p => {
          if (p.id === payment.id) {
            const updatedSignatures = p.signatures.map(sig => 
              sig.signer === address ? { ...sig, signed: true, timestamp: Date.now() } : sig
            )
            return { ...p, signatures: updatedSignatures }
          }
          return p
        })
      )
      
      setShowConfirmation(false)
    } catch (error) {
      console.error('Error signing payment:', error)
    }
  }

  const handleExecutePayment = async (payment: MultisigPayment) => {
    try {
      console.log('Executing payment:', payment.id)
      
      setMultisigPayments(prev => 
        prev.map(p => p.id === payment.id ? { 
          ...p, 
          status: 'executed',
          executedAt: Date.now()
        } : p)
      )
      
      setShowConfirmation(false)
    } catch (error) {
      console.error('Error executing payment:', error)
    }
  }

  const handleCancelPayment = async (payment: MultisigPayment) => {
    try {
      console.log('Cancelling payment:', payment.id)
      
      setMultisigPayments(prev => 
        prev.map(p => p.id === payment.id ? { ...p, status: 'cancelled' } : p)
      )
      
      setShowConfirmation(false)
    } catch (error) {
      console.error('Error cancelling payment:', error)
    }
  }

  const getStatusColor = (status: MultisigPayment['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'executed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: MultisigPayment['status']) => {
    switch (status) {
      case 'pending': return '等待激活'
      case 'active': return '等待签名'
      case 'executed': return '已执行'
      case 'cancelled': return '已取消'
      default: return '未知'
    }
  }

  const getSignedCount = (signatures: MultisigPayment['signatures']) => {
    return signatures.filter(sig => sig.signed).length
  }

  const canSign = (payment: MultisigPayment) => {
    if (!address || payment.status !== 'active') return false
    const userSignature = payment.signatures.find(sig => sig.signer === address)
    return userSignature && !userSignature.signed
  }

  const canExecute = (payment: MultisigPayment) => {
    if (payment.status !== 'active') return false
    const signedCount = getSignedCount(payment.signatures)
    return signedCount >= payment.threshold
  }

  const canCancel = (payment: MultisigPayment) => {
    return payment.status === 'active' && address === payment.creator
  }

  if (selectedPayment) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">多签支付详情</h2>
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
              <label className="block text-sm font-medium text-gray-700">签名进度</label>
              <p className="text-gray-900">
                {getSignedCount(selectedPayment.signatures)} / {selectedPayment.threshold} 
                <span className="text-gray-500 ml-1">(需要 {selectedPayment.threshold} 个签名)</span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">收款方</label>
            <p className="text-gray-900 font-mono">{selectedPayment.recipient}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">描述</label>
            <p className="text-gray-900">{selectedPayment.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">签名者状态</label>
            <div className="space-y-2">
              {selectedPayment.signatures.map((signature, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      signature.signed ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className="font-mono text-sm">
                      {signature.signer.slice(0, 6)}...{signature.signer.slice(-4)}
                    </span>
                    {signature.signer === address && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        你
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {signature.signed ? (
                      <span className="text-green-600">
                        已签名 {signature.timestamp && new Date(signature.timestamp).toLocaleString()}
                      </span>
                    ) : (
                      <span>等待签名</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {canSign(selectedPayment) && (
              <button
                onClick={() => {
                  setActionType('sign')
                  setShowConfirmation(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                签名确认
              </button>
            )}
            
            {canExecute(selectedPayment) && (
              <button
                onClick={() => {
                  setActionType('execute')
                  setShowConfirmation(true)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                执行支付
              </button>
            )}
            
            {canCancel(selectedPayment) && (
              <button
                onClick={() => {
                  setActionType('cancel')
                  setShowConfirmation(true)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                取消支付
              </button>
            )}
          </div>
        </div>

        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {actionType === 'sign' && '确认签名'}
                {actionType === 'execute' && '确认执行'}
                {actionType === 'cancel' && '确认取消'}
              </h3>
              <p className="text-gray-600 mb-4">
                {actionType === 'sign' && '您确定要为此多签支付签名吗？'}
                {actionType === 'execute' && '您确定要执行此多签支付吗？资金将被转移到收款方。'}
                {actionType === 'cancel' && '您确定要取消此多签支付吗？此操作不可撤销。'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (actionType === 'sign') handleSignPayment(selectedPayment)
                    else if (actionType === 'execute') handleExecutePayment(selectedPayment)
                    else if (actionType === 'cancel') handleCancelPayment(selectedPayment)
                  }}
                  className={`px-4 py-2 text-white rounded-lg ${
                    actionType === 'sign' ? 'bg-blue-600 hover:bg-blue-700' :
                    actionType === 'execute' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  确认
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
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
        <h2 className="text-2xl font-bold text-gray-900">多签支付管理</h2>
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
        {multisigPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无多签支付记录
          </div>
        ) : (
          multisigPayments.map((payment) => (
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
                    <span>{getSignedCount(payment.signatures)}/{payment.threshold} 签名</span>
                    <span>•</span>
                    <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>创建者: {payment.creator.slice(0, 6)}...{payment.creator.slice(-4)}</div>
                  <div>收款方: {payment.recipient.slice(0, 6)}...{payment.recipient.slice(-4)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}