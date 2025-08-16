'use client'

import { useState } from 'react'
import PaymentTypeSelector, { PaymentType } from './PaymentTypeSelector'

interface AdvancedLinkGeneratorProps {
  onLinkGenerated: (link: string) => void
}

interface BaseFormData {
  to: string
  amount: string
  token: string
  label: string
  message: string
  expires: string
}

interface EscrowFormData extends BaseFormData {
  arbitrator?: string
  timelock?: string
  arbitrationFee?: string
  description?: string
}

interface MultisigFormData extends BaseFormData {
  signers: string[]
  threshold: string
}

interface ConditionalFormData extends BaseFormData {
  conditionType: 'time' | 'block' | 'price'
  conditionValue: string
  priceToken?: string
  priceThreshold?: string
}

interface SplitFormData extends BaseFormData {
  recipients: Array<{ address: string; percentage: string }>
}

interface NFTFormData extends BaseFormData {
  nftContract: string
  tokenId: string
  paymentToken: string
}

type FormData = BaseFormData | EscrowFormData | MultisigFormData | ConditionalFormData | SplitFormData | NFTFormData

export default function AdvancedLinkGenerator({ onLinkGenerated }: AdvancedLinkGeneratorProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>('regular')
  const [formData, setFormData] = useState<BaseFormData>({
    to: '',
    amount: '',
    token: 'MON',
    label: '',
    message: '',
    expires: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateBaseForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.to) {
      newErrors.to = '收款地址不能为空'
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.to)) {
      newErrors.to = '请输入有效的以太坊地址'
    }

    if (!formData.amount) {
      newErrors.amount = '金额不能为空'
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = '请输入有效的金额'
    }

    if (!formData.token) {
      newErrors.token = '代币不能为空'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateLink = () => {
    if (!validateBaseForm()) return

    const params = new URLSearchParams()
    params.append('type', paymentType)
    params.append('to', formData.to)
    params.append('amount', formData.amount)
    params.append('token', formData.token)
    
    if (formData.label) params.append('label', formData.label)
    if (formData.message) params.append('message', formData.message)
    if (formData.expires) {
      const expiresTimestamp = new Date(formData.expires).getTime() / 1000
      params.append('expires', expiresTimestamp.toString())
    }

    // 根据支付类型添加特定参数
    switch (paymentType) {
      case 'escrow':
        const escrowData = formData as EscrowFormData
        if (escrowData.arbitrator) params.append('arbitrator', escrowData.arbitrator)
        if (escrowData.arbitrationFee) params.append('arbitrationFee', escrowData.arbitrationFee)
        if (escrowData.timelock) params.append('timelock', escrowData.timelock)
        if (escrowData.description) params.append('description', escrowData.description)
        break
      case 'multisig':
        const multisigData = formData as MultisigFormData
        if (multisigData.signers?.length) params.append('signers', multisigData.signers.join(','))
        if (multisigData.threshold) params.append('threshold', multisigData.threshold)
        break
      case 'conditional':
        const conditionalData = formData as ConditionalFormData
        if (conditionalData.conditionType) params.append('conditionType', conditionalData.conditionType)
        if (conditionalData.conditionValue) params.append('conditionValue', conditionalData.conditionValue)
        if (conditionalData.priceToken) params.append('priceToken', conditionalData.priceToken)
        if (conditionalData.priceThreshold) params.append('priceThreshold', conditionalData.priceThreshold)
        break
      case 'split':
        const splitData = formData as SplitFormData
        if (splitData.recipients?.length) {
          params.append('recipients', JSON.stringify(splitData.recipients))
        }
        break
      case 'nft':
        const nftData = formData as NFTFormData
        if (nftData.nftContract) params.append('nftContract', nftData.nftContract)
        if (nftData.tokenId) params.append('tokenId', nftData.tokenId)
        if (nftData.paymentToken) params.append('paymentToken', nftData.paymentToken)
        break
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://monadpay.app'
    const link = `${baseUrl}/pay?${params.toString()}`
    onLinkGenerated(link)
  }

  const handleInputChange = (field: string, value: string | string[] | { address: string; percentage: string }[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handlePaymentTypeChange = (type: PaymentType) => {
    setPaymentType(type)
    // 重置表单数据，保留基础字段
    const baseData = {
      to: formData.to,
      amount: formData.amount,
      token: formData.token,
      label: formData.label,
      message: formData.message,
      expires: formData.expires
    }
    
    // 根据支付类型初始化特定字段
    switch (type) {
      case 'escrow':
        setFormData({ ...baseData, arbitrator: '', timelock: '24', arbitrationFee: '10', description: '' } as EscrowFormData)
        break
      case 'multisig':
        setFormData({ ...baseData, signers: [''], threshold: '1' } as MultisigFormData)
        break
      case 'conditional':
        setFormData({ ...baseData, conditionType: 'time', conditionValue: '' } as ConditionalFormData)
        break
      case 'split':
        setFormData({ ...baseData, recipients: [{ address: '', percentage: '' }] } as SplitFormData)
        break
      case 'nft':
        setFormData({ ...baseData, nftContract: '', tokenId: '', paymentToken: 'MON' } as NFTFormData)
        break
      default:
        setFormData(baseData)
    }
    setErrors({})
  }

  const renderBaseForm = () => (
    <>
      {/* 收款地址 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          收款地址 *
        </label>
        <input
          type="text"
          value={formData.to}
          onChange={(e) => handleInputChange('to', e.target.value)}
          placeholder="0x742d35Cc6634C0532925a3b8D4C9db96590c6C87"
          className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm ${
            errors.to ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.to && <p className="text-red-500 text-sm mt-1">{errors.to}</p>}
      </div>

      {/* 金额和代币 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            金额 *
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="10"
            step="0.000001"
            min="0"
            className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm ${
              errors.amount ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            代币 *
          </label>
          <select
            value={formData.token}
            onChange={(e) => handleInputChange('token', e.target.value)}
            className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm ${
              errors.token ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="MON">MON</option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value="ETH">ETH</option>
          </select>
          {errors.token && <p className="text-red-500 text-sm mt-1">{errors.token}</p>}
        </div>
      </div>

      {/* 标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          标签 (可选)
        </label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => handleInputChange('label', e.target.value)}
          placeholder="coffee"
          className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
        />
      </div>

      {/* 消息 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          消息 (可选)
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder="Thanks for the coffee!"
          rows={3}
          className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm resize-none"
        />
      </div>

      {/* 过期时间 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          过期时间 (可选)
        </label>
        <input
          type="datetime-local"
          value={formData.expires}
          onChange={(e) => handleInputChange('expires', e.target.value)}
          className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
        />
      </div>
    </>
  )

  const renderTypeSpecificForm = () => {
    switch (paymentType) {
      case 'escrow':
        const escrowData = formData as EscrowFormData
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                仲裁人地址
              </label>
              <input
                type="text"
                value={escrowData.arbitrator || ''}
                onChange={(e) => handleInputChange('arbitrator', e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                托管期限 (小时)
              </label>
              <input
                type="number"
                value={escrowData.timelock || ''}
                onChange={(e) => handleInputChange('timelock', e.target.value)}
                placeholder="24"
                min="1"
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                仲裁费用 (MON)
              </label>
              <input
                type="number"
                value={escrowData.arbitrationFee || ''}
                onChange={(e) => handleInputChange('arbitrationFee', e.target.value)}
                placeholder="10"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                托管描述
              </label>
              <textarea
                value={escrowData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="描述托管条件和交付要求..."
                rows={3}
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm resize-none"
              />
            </div>
          </>
        )
      
      case 'multisig':
        const multisigData = formData as MultisigFormData
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                签名者地址 (每行一个)
              </label>
              <textarea
                value={multisigData.signers?.join('\n') || ''}
                onChange={(e) => {
                  const signers = e.target.value.split('\n').filter(s => s.trim())
                  handleInputChange('signers', signers)
                }}
                placeholder="0x...\n0x...\n0x..."
                rows={4}
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                签名阈值
              </label>
              <input
                type="number"
                value={multisigData.threshold || ''}
                onChange={(e) => handleInputChange('threshold', e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              />
            </div>
          </>
        )
      
      case 'conditional':
        const conditionalData = formData as ConditionalFormData
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                条件类型
              </label>
              <select
                value={conditionalData.conditionType || 'time'}
                onChange={(e) => handleInputChange('conditionType', e.target.value)}
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              >
                <option value="time">时间条件</option>
                <option value="block">区块高度</option>
                <option value="price">价格条件</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {conditionalData.conditionType === 'time' ? '触发时间' : 
                 conditionalData.conditionType === 'block' ? '目标区块高度' : '价格阈值'}
              </label>
              {conditionalData.conditionType === 'time' ? (
                <input
                  type="datetime-local"
                  value={conditionalData.conditionValue || ''}
                  onChange={(e) => handleInputChange('conditionValue', e.target.value)}
                  className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                />
              ) : (
                <input
                  type="number"
                  value={conditionalData.conditionValue || ''}
                  onChange={(e) => handleInputChange('conditionValue', e.target.value)}
                  placeholder={conditionalData.conditionType === 'block' ? '18000000' : '100'}
                  className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                />
              )}
            </div>
            {conditionalData.conditionType === 'price' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    价格代币
                  </label>
                  <select
                    value={conditionalData.priceToken || 'MON'}
                    onChange={(e) => handleInputChange('priceToken', e.target.value)}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                  >
                    <option value="MON">MON</option>
                    <option value="ETH">ETH</option>
                    <option value="BTC">BTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目标价格 (USD)
                  </label>
                  <input
                    type="number"
                    value={conditionalData.priceThreshold || ''}
                    onChange={(e) => handleInputChange('priceThreshold', e.target.value)}
                    placeholder="100"
                    step="0.01"
                    className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
                  />
                </div>
              </div>
            )}
          </>
        )
      
      case 'split':
        const splitData = formData as SplitFormData
        const recipients = splitData.recipients || [{ address: '', percentage: '' }]
        return (
          <>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  接收者列表
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newRecipients = [...recipients, { address: '', percentage: '' }]
                    handleInputChange('recipients', newRecipients)
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + 添加接收者
                </button>
              </div>
              <div className="space-y-3">
                {recipients.map((recipient, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={recipient.address}
                        onChange={(e) => {
                          const newRecipients = [...recipients]
                          newRecipients[index].address = e.target.value
                          handleInputChange('recipients', newRecipients)
                        }}
                        placeholder="接收者地址 0x..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={recipient.percentage}
                        onChange={(e) => {
                          const newRecipients = [...recipients]
                          newRecipients[index].percentage = e.target.value
                          handleInputChange('recipients', newRecipients)
                        }}
                        placeholder="%"
                        min="0"
                        max="100"
                        step="0.1"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      {recipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newRecipients = recipients.filter((_, i) => i !== index)
                            handleInputChange('recipients', newRecipients)
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                总百分比: {recipients.reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0).toFixed(1)}%
              </p>
            </div>
          </>
        )
      
      case 'nft':
        const nftData = formData as NFTFormData
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NFT合约地址
              </label>
              <input
                type="text"
                value={nftData.nftContract || ''}
                onChange={(e) => handleInputChange('nftContract', e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token ID
              </label>
              <input
                type="number"
                value={nftData.tokenId || ''}
                onChange={(e) => handleInputChange('tokenId', e.target.value)}
                placeholder="1"
                min="0"
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                支付代币
              </label>
              <select
                value={nftData.paymentToken || 'MON'}
                onChange={(e) => handleInputChange('paymentToken', e.target.value)}
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-sm"
              >
                <option value="MON">MON</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <PaymentTypeSelector 
        selectedType={paymentType} 
        onTypeChange={handlePaymentTypeChange} 
      />
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">支付详情</h3>
        <div className="space-y-4">
          {renderBaseForm()}
          {renderTypeSpecificForm()}
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={generateLink}
        className="w-full bg-blue-600 text-white py-4 sm:py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-base sm:text-sm touch-manipulation"
      >
        生成支付链接
      </button>
    </div>
  )
}