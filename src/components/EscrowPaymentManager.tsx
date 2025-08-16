'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi'
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem'
import { getContractAddress } from '../config/contracts'

interface EscrowPayment {
  id: string
  payer: string
  recipient: string
  arbiter: string
  amount: string
  token: string
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'refunded'
  deadline: number
  description: string
  createdAt: number
  disputeReason?: string
  completed: boolean
  disputed: boolean
  released: boolean
}

interface EscrowPaymentManagerProps {
  paymentId?: string
  onClose?: () => void
}

// 合约ABI - 只包含托管支付相关的函数
const ESCROW_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "escrowId", "type": "uint256"}],
    "name": "getEscrow",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "payer", "type": "address"},
        {"internalType": "address", "name": "recipient", "type": "address"},
        {"internalType": "address", "name": "arbiter", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"},
        {"internalType": "address", "name": "token", "type": "address"},
        {"internalType": "uint256", "name": "deadline", "type": "uint256"},
        {"internalType": "bool", "name": "completed", "type": "bool"},
        {"internalType": "bool", "name": "disputed", "type": "bool"},
        {"internalType": "bool", "name": "released", "type": "bool"},
        {"internalType": "string", "name": "description", "type": "string"},
        {"internalType": "uint256", "name": "createdAt", "type": "uint256"}
      ],
      "internalType": "struct MonadPay.EscrowPayment",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "escrowId", "type": "uint256"}],
    "name": "releaseEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "escrowId", "type": "uint256"}],
    "name": "refundEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "escrowId", "type": "uint256"},
      {"internalType": "string", "name": "reason", "type": "string"}
    ],
    "name": "raiseDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "escrowId", "type": "uint256"},
      {"internalType": "bool", "name": "favorPayer", "type": "bool"},
      {"internalType": "string", "name": "resolution", "type": "string"}
    ],
    "name": "resolveDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "address", "name": "arbiter", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "string", "name": "description", "type": "string"}
    ],
    "name": "createEscrow",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "payer", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "recipient", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "EscrowCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "recipient", "type": "address"}
    ],
    "name": "EscrowReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "payer", "type": "address"}
    ],
    "name": "EscrowRefunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "disputeRaiser", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "reason", "type": "string"}
    ],
    "name": "DisputeRaised",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "arbiter", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "favorPayer", "type": "bool"}
    ],
    "name": "DisputeResolved",
    "type": "event"
  }
] as const

export default function EscrowPaymentManager({ paymentId, onClose }: EscrowPaymentManagerProps) {
  const { address, chainId } = useAccount()
  const [escrowPayments, setEscrowPayments] = useState<EscrowPayment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<EscrowPayment | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [showDispute, setShowDispute] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // 错误处理辅助函数
  const handleError = (error: any, defaultMessage: string) => {
    console.error('Transaction error:', error)
    
    let errorMessage = defaultMessage
    
    if (error?.message) {
      if (error.message.includes('User rejected')) {
        errorMessage = '用户取消了交易'
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = '余额不足，请检查您的账户余额'
      } else if (error.message.includes('network')) {
        errorMessage = '网络连接错误，请检查网络连接后重试'
      } else if (error.message.includes('gas')) {
        errorMessage = 'Gas 费用不足，请增加 Gas 限制'
      } else if (error.message.includes('deadline')) {
        errorMessage = '截止时间已过，无法执行此操作'
      } else if (error.message.includes('not authorized')) {
        errorMessage = '您没有权限执行此操作'
      } else if (error.message.includes('already completed')) {
        errorMessage = '此托管支付已经完成'
      } else if (error.message.includes('already disputed')) {
        errorMessage = '此托管支付已经存在争议'
      }
    }
    
    setError(errorMessage)
    
    // 5秒后自动清除错误消息
    setTimeout(() => {
      setError(null)
    }, 5000)
  }
  
  // 成功消息处理函数
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    
    // 3秒后自动清除成功消息
    setTimeout(() => {
      setSuccessMessage(null)
    }, 3000)
  }
  
  // 创建托管支付的表单状态
  const [createForm, setCreateForm] = useState({
    recipient: '',
    arbiter: '',
    amount: '',
    token: '0x0000000000000000000000000000000000000000', // ETH/MON
    deadline: '',
    description: ''
  })
  
  const contractAddress = chainId ? getContractAddress(chainId) : undefined
  
  const { writeContract } = useWriteContract()
  
  // 监听托管支付创建事件
  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: ESCROW_ABI,
    eventName: 'EscrowCreated',
    onLogs(logs) {
      console.log('EscrowCreated event:', logs)
      // 重新加载数据
      loadEscrowPayments()
    },
    enabled: !!contractAddress
  })
  
  // 监听托管支付释放事件
  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: ESCROW_ABI,
    eventName: 'EscrowReleased',
    onLogs(logs) {
      console.log('EscrowReleased event:', logs)
      // 重新加载数据
      loadEscrowPayments()
    },
    enabled: !!contractAddress
  })
  
  // 监听托管支付退款事件
  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: ESCROW_ABI,
    eventName: 'EscrowRefunded',
    onLogs(logs) {
      console.log('EscrowRefunded event:', logs)
      // 重新加载数据
      loadEscrowPayments()
    },
    enabled: !!contractAddress
  })
  
  // 监听争议提起事件
  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: ESCROW_ABI,
    eventName: 'DisputeRaised',
    onLogs(logs) {
      console.log('DisputeRaised event:', logs)
      // 重新加载数据
      loadEscrowPayments()
    },
    enabled: !!contractAddress
  })
  
  // 监听争议解决事件
  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi: ESCROW_ABI,
    eventName: 'DisputeResolved',
    onLogs(logs) {
      console.log('DisputeResolved event:', logs)
      // 重新加载数据
      loadEscrowPayments()
    },
    enabled: !!contractAddress
  })

  // 加载托管支付数据
  useEffect(() => {
    if (!contractAddress || !address) return
    
    loadEscrowPayments()
  }, [contractAddress, address, paymentId])
  
  const loadEscrowPayments = async () => {
    if (!contractAddress) return
    
    setLoading(true)
    setError(null)
    
    try {
      // 这里我们需要实现一个方法来获取用户相关的托管支付
      // 由于合约没有提供批量查询方法，我们先创建一个演示数据
      // 在实际应用中，可以通过事件日志或后端API来获取
      const payments: EscrowPayment[] = []
      
      // 尝试读取一些托管支付（假设ID从1开始）
      for (let i = 1; i <= 10; i++) {
        try {
          const escrowData = await readEscrowData(i)
          if (escrowData && (escrowData.payer === address || escrowData.recipient === address || escrowData.arbiter === address)) {
            payments.push(escrowData)
          }
        } catch (error) {
          // 如果托管支付不存在，跳过
          break
        }
      }
      
      setEscrowPayments(payments)
      
      if (paymentId) {
        const payment = payments.find(p => p.id === paymentId)
        if (payment) {
          setSelectedPayment(payment)
        } else {
          // 尝试直接读取指定的支付ID
          try {
            const escrowData = await readEscrowData(parseInt(paymentId))
            if (escrowData) {
              setSelectedPayment(escrowData)
            }
          } catch (error) {
            setError(`无法找到托管支付 ID: ${paymentId}`)
          }
        }
      }
    } catch (error) {
      console.error('Error loading escrow payments:', error)
      setError('加载托管支付数据失败')
    } finally {
      setLoading(false)
    }
  }
  
  const readEscrowData = async (escrowId: number): Promise<EscrowPayment | null> => {
    if (!contractAddress) return null
    
    try {
      // 这里需要使用 useReadContract，但由于它是 hook，我们需要重构
      // 暂时返回 null，稍后会修复
      return null
    } catch (error) {
      throw error
    }
  }

  const handleCompletePayment = async (payment: EscrowPayment) => {
    if (!contractAddress) {
      setError('合约地址未找到')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'releaseEscrow',
        args: [BigInt(payment.id)]
      })
      
      // 等待交易确认后重新加载数据
      setTimeout(() => {
        loadEscrowPayments()
      }, 3000)
      
    showSuccess('托管支付已成功完成！')
       
     } catch (error) {
       handleError(error, '完成支付失败')
     } finally {
       setLoading(false)
     }
  }

  const handleRefundPayment = async (payment: EscrowPayment) => {
    if (!contractAddress) {
      setError('合约地址未找到')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'refundEscrow',
        args: [BigInt(payment.id)]
      })
      
      // 等待交易确认后重新加载数据
      setTimeout(() => {
        loadEscrowPayments()
      }, 3000)
      
    showSuccess('托管支付已成功退款！')
       
     } catch (error) {
       handleError(error, '退款失败')
     } finally {
       setLoading(false)
     }
  }

  const handleRaiseDispute = async (payment: EscrowPayment) => {
    if (!disputeReason.trim()) return
    if (!contractAddress) {
      setError('合约地址未找到')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'raiseDispute',
        args: [BigInt(payment.id), disputeReason]
      })
      
      setShowDispute(false)
      setDisputeReason('')
      
      // 等待交易确认后重新加载数据
      setTimeout(() => {
        loadEscrowPayments()
      }, 3000)
      
    showSuccess('争议已成功提起！')
       
     } catch (error) {
       handleError(error, '提起争议失败')
     } finally {
       setLoading(false)
     }
  }

  const handleResolveDispute = async (payment: EscrowPayment, favorPayer: boolean) => {
    if (!contractAddress) {
      setError('合约地址未找到')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'resolveDispute',
        args: [BigInt(payment.id), favorPayer, favorPayer ? '支持付款方' : '支持收款方']
      })
      
      // 等待交易确认后重新加载数据
      setTimeout(() => {
        loadEscrowPayments()
      }, 3000)
      
    showSuccess('争议已成功解决！')
       
     } catch (error) {
       handleError(error, '解决争议失败')
     } finally {
       setLoading(false)
     }
   }
   
   const handleCreateEscrow = async () => {
     if (!contractAddress) {
       setError('合约地址未找到')
       return
     }
     
     if (!createForm.recipient || !createForm.arbiter || !createForm.amount || !createForm.deadline || !createForm.description) {
       setError('请填写所有必填字段')
       return
     }
     
     setLoading(true)
     setError(null)
     
     try {
       const deadlineTimestamp = Math.floor(new Date(createForm.deadline).getTime() / 1000)
       const amountWei = parseEther(createForm.amount)
       
       await writeContract({
         address: contractAddress as `0x${string}`,
         abi: ESCROW_ABI,
         functionName: 'createEscrow',
         args: [
           createForm.recipient as `0x${string}`,
           createForm.arbiter as `0x${string}`,
           amountWei,
           createForm.token as `0x${string}`,
           BigInt(deadlineTimestamp),
           createForm.description
         ],
         value: createForm.token === '0x0000000000000000000000000000000000000000' ? amountWei : BigInt(0)
       })
       
       // 重置表单
       setCreateForm({
         recipient: '',
         arbiter: '',
         amount: '',
         token: '0x0000000000000000000000000000000000000000',
         deadline: '',
         description: ''
       })
       
       setShowCreateForm(false)
       
       // 等待交易确认后重新加载数据
       setTimeout(() => {
         loadEscrowPayments()
       }, 3000)
       
       showSuccess('托管支付创建成功！')
       
     } catch (error) {
       handleError(error, '创建托管支付失败')
     } finally {
       setLoading(false)
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

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
            处理中，请稍候...
          </div>
        )}
        
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
              <label className="block text-sm font-medium text-gray-700">截止时间</label>
              <p className="text-gray-900">{new Date(selectedPayment.deadline * 1000).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">付款方</label>
            <p className="text-gray-900 font-mono">{selectedPayment.payer}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">收款方</label>
            <p className="text-gray-900 font-mono">{selectedPayment.recipient}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">仲裁人</label>
            <p className="text-gray-900 font-mono">{selectedPayment.arbiter}</p>
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
            {selectedPayment.status === 'funded' && address === selectedPayment.recipient && (
              <button
                onClick={() => handleCompletePayment(selectedPayment)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    处理中...
                  </>
                ) : (
                  '确认完成'
                )}
              </button>
            )}
            
            {selectedPayment.status === 'funded' && address === selectedPayment.payer && (
              <button
                onClick={() => setShowDispute(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={loading}
              >
                提起争议
              </button>
            )}
            
            {selectedPayment.status === 'disputed' && address === selectedPayment.arbiter && (
              <>
                <button
                  onClick={() => handleResolveDispute(selectedPayment, false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  disabled={loading}
                >
                  支持收款方
                </button>
                <button
                  onClick={() => handleResolveDispute(selectedPayment, true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  disabled={loading}
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
                  disabled={!disputeReason.trim() || loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      提交中...
                    </>
                  ) : (
                    '提交争议'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDispute(false)
                    setDisputeReason('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  disabled={loading}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
      )}
      
      {/* 创建托管支付表单弹窗 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">创建托管支付</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  收款方地址 *
                </label>
                <input
                  type="text"
                  value={createForm.recipient}
                  onChange={(e) => setCreateForm({...createForm, recipient: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  仲裁员地址 *
                </label>
                <input
                  type="text"
                  value={createForm.arbiter}
                  onChange={(e) => setCreateForm({...createForm, arbiter: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  金额 (MON) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({...createForm, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  截止日期 *
                </label>
                <input
                  type="datetime-local"
                  value={createForm.deadline}
                  onChange={(e) => setCreateForm({...createForm, deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述 *
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="请描述托管支付的用途..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={loading}
              >
                取消
              </button>
              <button
                onClick={handleCreateEscrow}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={loading}
              >
                {loading ? '创建中...' : '创建托管支付'}
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            disabled={loading}
          >
            创建托管支付
          </button>
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

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-500 hover:text-green-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}
      
      {loading && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            处理中，请稍候...
          </div>
        </div>
      )}

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