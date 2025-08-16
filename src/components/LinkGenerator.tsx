'use client'

import { useState } from 'react'

interface LinkGeneratorProps {
  onLinkGenerated: (link: string) => void
}

interface FormData {
  to: string
  amount: string
  token: string
  label: string
  message: string
  expires: string
}

export default function LinkGenerator({ onLinkGenerated }: LinkGeneratorProps) {
  const [formData, setFormData] = useState<FormData>({
    to: '',
    amount: '',
    token: 'MON',
    label: '',
    message: '',
    expires: ''
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

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
    if (!validateForm()) return

    const params = new URLSearchParams()
    params.append('to', formData.to)
    params.append('amount', formData.amount)
    params.append('token', formData.token)
    
    if (formData.label) params.append('label', formData.label)
    if (formData.message) params.append('message', formData.message)
    if (formData.expires) {
      const expiresTimestamp = new Date(formData.expires).getTime() / 1000
      params.append('expires', expiresTimestamp.toString())
    }

    // 生成标准的HTTP链接，兼容更多钱包和设备
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://monadpay.app'
    const link = `${baseUrl}/pay?${params.toString()}`
    onLinkGenerated(link)
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="space-y-6">
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
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.to ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.to && <p className="text-red-500 text-sm mt-1">{errors.to}</p>}
      </div>

      {/* 金额和代币 */}
      <div className="grid grid-cols-2 gap-4">
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 生成按钮 */}
      <button
        onClick={generateLink}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
      >
        生成支付链接
      </button>
    </div>
  )
}