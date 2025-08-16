'use client'

import { useState } from 'react'

export type PaymentType = 'regular' | 'escrow' | 'multisig' | 'conditional' | 'split' | 'nft'

interface PaymentTypeSelectorProps {
  selectedType: PaymentType
  onTypeChange: (type: PaymentType) => void
}

const paymentTypes = [
  {
    id: 'regular' as PaymentType,
    name: '常规支付',
    description: '标准的点对点支付',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    color: 'blue'
  },
  {
    id: 'escrow' as PaymentType,
    name: '托管支付',
    description: '第三方托管，支持争议解决',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'green'
  },
  {
    id: 'multisig' as PaymentType,
    name: '多签支付',
    description: '需要多个签名确认的支付',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'purple'
  },
  {
    id: 'conditional' as PaymentType,
    name: '条件支付',
    description: '基于时间或条件触发的支付',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'orange'
  },
  {
    id: 'split' as PaymentType,
    name: '分割支付',
    description: '自动分配给多个接收者',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
      </svg>
    ),
    color: 'indigo'
  },
  {
    id: 'nft' as PaymentType,
    name: 'NFT支付',
    description: 'NFT买卖的托管支付',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'pink'
  }
]

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selectedBg: 'bg-blue-100',
    selectedBorder: 'border-blue-500',
    icon: 'text-blue-600',
    selectedIcon: 'text-blue-700'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    selectedBg: 'bg-green-100',
    selectedBorder: 'border-green-500',
    icon: 'text-green-600',
    selectedIcon: 'text-green-700'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    selectedBg: 'bg-purple-100',
    selectedBorder: 'border-purple-500',
    icon: 'text-purple-600',
    selectedIcon: 'text-purple-700'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    selectedBg: 'bg-orange-100',
    selectedBorder: 'border-orange-500',
    icon: 'text-orange-600',
    selectedIcon: 'text-orange-700'
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    selectedBg: 'bg-indigo-100',
    selectedBorder: 'border-indigo-500',
    icon: 'text-indigo-600',
    selectedIcon: 'text-indigo-700'
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    selectedBg: 'bg-pink-100',
    selectedBorder: 'border-pink-500',
    icon: 'text-pink-600',
    selectedIcon: 'text-pink-700'
  }
}

export default function PaymentTypeSelector({ selectedType, onTypeChange }: PaymentTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">选择支付类型</h3>
        <p className="text-sm text-gray-600 mb-4">
          选择适合您需求的支付模式，每种模式都有不同的功能和安全特性。
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {paymentTypes.map((type) => {
          const isSelected = selectedType === type.id
          const colors = colorClasses[type.color as keyof typeof colorClasses]
          
          return (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.id)}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md
                ${isSelected 
                  ? `${colors.selectedBg} ${colors.selectedBorder} shadow-sm` 
                  : `${colors.bg} ${colors.border} hover:${colors.selectedBg}`
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <div className={`
                  flex-shrink-0 p-2 rounded-lg
                  ${isSelected ? colors.selectedIcon : colors.icon}
                `}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {type.name}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {type.description}
                  </p>
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className={`w-2 h-2 rounded-full ${colors.selectedBorder.replace('border-', 'bg-')}`} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}