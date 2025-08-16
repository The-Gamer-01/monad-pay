'use client'

import { useState, useEffect } from 'react'
import {
  WalletInfo,
  DeepLinkParams,
  WalletDetectionResult,
  detectWalletInstallation,
  openWalletWithFallback,
  getRecommendedWallets,
  isMobile,
  detectPlatform
} from '../utils/walletDetection'

interface MobileWalletSelectorProps {
  params: DeepLinkParams
  fallbackUrl: string
  onWalletSelected?: (walletId: string) => void
  onError?: (error: string) => void
}

interface WalletStatus {
  wallet: WalletInfo
  detection: WalletDetectionResult
  isLoading: boolean
  error?: string
}

export default function MobileWalletSelector({
  params,
  fallbackUrl,
  onWalletSelected,
  onError
}: MobileWalletSelectorProps) {
  const [walletStatuses, setWalletStatuses] = useState<WalletStatus[]>([])
  const [isDetecting, setIsDetecting] = useState(true)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [showAllWallets, setShowAllWallets] = useState(false)
  const [platform] = useState(detectPlatform())
  const [mobile] = useState(isMobile())
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string>('')

  useEffect(() => {
    detectWallets()
  }, [params])

  const detectWallets = async () => {
    setIsDetecting(true)
    setLastError('')
    
    try {
      const recommendedWallets = getRecommendedWallets()
      const statuses: WalletStatus[] = []
      
      for (const wallet of recommendedWallets) {
        try {
          const detection = await detectWalletInstallation(wallet.id)
          statuses.push({
            wallet,
            detection,
            isLoading: false
          })
        } catch (error) {
          console.error(`Failed to detect wallet ${wallet.id}:`, error)
          statuses.push({
            wallet,
            detection: {
              installed: false,
              supported: false,
              confidence: 0,
              deepLink: '',
              fallbackLink: ''
            },
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      // 按优先级排序：已安装 > 支持 > 其他
      statuses.sort((a, b) => {
        if (a.detection.installed !== b.detection.installed) {
          return a.detection.installed ? -1 : 1
        }
        if (a.detection.confidence !== b.detection.confidence) {
          return b.detection.confidence - a.detection.confidence
        }
        return a.wallet.priority - b.wallet.priority
      })
      
      setWalletStatuses(statuses)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to detect wallets'
      setLastError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleWalletClick = async (walletId: string) => {
    setSelectedWallet(walletId)
    setWalletStatuses(prev => 
      prev.map(status => 
        status.wallet.id === walletId 
          ? { ...status, isLoading: true, error: undefined }
          : status
      )
    )
    
    try {
      onWalletSelected?.(walletId)
      
      const success = await openWalletWithFallback(walletId, params, {
        fallbackUrl,
        timeout: 5000, // 移动端给更长的超时时间
        onSuccess: () => {
          console.log(`Successfully opened ${walletId}`)
          setSelectedWallet(null)
        },
        onFallback: () => {
          console.log(`Fallback triggered for ${walletId}`)
          setSelectedWallet(null)
        },
        onError: (error) => {
          console.error(`Error opening ${walletId}:`, error)
          const errorMessage = error instanceof Error ? error.message : 'Failed to open wallet'
          setWalletStatuses(prev => 
            prev.map(status => 
              status.wallet.id === walletId 
                ? { ...status, isLoading: false, error: errorMessage }
                : status
            )
          )
          onError?.(errorMessage)
        }
      })
      
      if (!success) {
        // 最后的回退：显示错误并提供手动选项
        setWalletStatuses(prev => 
          prev.map(status => 
            status.wallet.id === walletId 
              ? { ...status, isLoading: false, error: 'Unable to open wallet automatically' }
              : status
          )
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error'
      setWalletStatuses(prev => 
        prev.map(status => 
          status.wallet.id === walletId 
            ? { ...status, isLoading: false, error: errorMessage }
            : status
        )
      )
      onError?.(errorMessage)
    } finally {
      setSelectedWallet(null)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    detectWallets()
  }

  const getWalletStatusIcon = (status: WalletStatus) => {
    if (status.isLoading) {
      return '⏳'
    }
    if (status.error) {
      return '❌'
    }
    if (status.detection.installed && status.detection.confidence > 0.7) {
      return '✅'
    } else if (status.detection.supported) {
      return '❓'
    } else {
      return '⚪'
    }
  }

  const getWalletStatusText = (status: WalletStatus) => {
    if (status.isLoading) {
      return '打开中...'
    }
    if (status.error) {
      return '错误'
    }
    if (status.detection.installed && status.detection.confidence > 0.7) {
      return '已安装'
    } else if (status.detection.supported && status.detection.confidence > 0.3) {
      return '可能已安装'
    } else if (status.detection.supported) {
      return '支持'
    } else {
      return '不支持'
    }
  }

  const getRecommendedWalletsLocal = () => {
    return walletStatuses.filter(status => 
      status.detection.installed && status.detection.confidence > 0.5
    )
  }

  const getSupportedWallets = () => {
    return walletStatuses.filter(status => 
      status.detection.supported && !status.detection.installed
    )
  }

  if (isDetecting) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">检测可用钱包中...</p>
        <p className="mt-2 text-sm text-gray-500">平台: {platform} | 设备: {mobile ? '移动端' : '桌面端'}</p>
      </div>
    )
  }

  if (lastError && walletStatuses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">检测钱包时出错</h3>
        <p className="text-gray-600 mb-4">{lastError}</p>
        <button
          onClick={handleRetry}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          重试 ({retryCount + 1})
        </button>
      </div>
    )
  }

  const recommendedWallets = getRecommendedWalletsLocal()
  const supportedWallets = getSupportedWallets()

  return (
    <div className="space-y-6">
      {/* 平台信息 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{mobile ? '📱' : '💻'}</span>
            <span className="text-gray-700">
              <span className="font-medium">{platform}</span> • {mobile ? '移动端' : '桌面端'}
            </span>
          </div>
          <button
            onClick={handleRetry}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* 推荐钱包 */}
      {recommendedWallets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="text-green-500 mr-2">⭐</span>
            推荐钱包
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {recommendedWallets.map((status) => (
              <button
                key={status.wallet.id}
                onClick={() => handleWalletClick(status.wallet.id)}
                disabled={status.isLoading || !!status.error}
                className={`${status.wallet.color} ${status.isLoading || status.error ? 'opacity-70' : 'hover:opacity-90'} 
                  text-white p-4 rounded-xl transition-all duration-200 flex items-center space-x-4 relative overflow-hidden`}
              >
                {/* 背景装饰 */}
                <div className="absolute inset-0 bg-white bg-opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                
                {/* 钱包图标 */}
                <div className="text-3xl">{status.wallet.icon}</div>
                
                {/* 钱包信息 */}
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg">{status.wallet.displayName}</div>
                  <div className="text-sm opacity-90">{getWalletStatusText(status)}</div>
                  {status.error && (
                    <div className="text-xs opacity-75 mt-1 bg-red-500 bg-opacity-20 px-2 py-1 rounded">
                      {status.error}
                    </div>
                  )}
                </div>
                
                {/* 状态指示器 */}
                <div className="text-xl">
                  {getWalletStatusIcon(status)}
                </div>
                
                {/* 置信度条 */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-20">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${status.detection.confidence * 100}%` }}
                  ></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 其他支持的钱包 */}
      {supportedWallets.length > 0 && (
        <div>
          <button
            onClick={() => setShowAllWallets(!showAllWallets)}
            className="w-full flex items-center justify-between text-gray-700 font-medium py-2"
          >
            <span className="flex items-center">
              <span className="text-blue-500 mr-2">💼</span>
              其他钱包 ({supportedWallets.length})
            </span>
            <span className={`transform transition-transform ${showAllWallets ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {showAllWallets && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {supportedWallets.map((status) => (
                <button
                  key={status.wallet.id}
                  onClick={() => handleWalletClick(status.wallet.id)}
                  disabled={status.isLoading || !!status.error}
                  className={`${status.wallet.color} ${status.isLoading || status.error ? 'opacity-50' : 'hover:opacity-90'} 
                    text-white p-3 rounded-lg transition-all duration-200 flex flex-col items-center space-y-2 relative`}
                >
                  {/* 状态指示器 */}
                  <div className="absolute top-2 right-2 text-xs">
                    {getWalletStatusIcon(status)}
                  </div>
                  
                  <span className="text-2xl">{status.wallet.icon}</span>
                  <span className="text-sm font-medium text-center">{status.wallet.displayName}</span>
                  <span className="text-xs opacity-75">{getWalletStatusText(status)}</span>
                  
                  {status.error && (
                    <div className="text-xs opacity-75 bg-red-500 bg-opacity-20 px-2 py-1 rounded w-full text-center">
                      错误
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 手动回退选项 */}
      <div className="border-t pt-4">
        <button
          onClick={() => window.open(fallbackUrl, '_blank')}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <span>🌐</span>
          <span>在浏览器中打开</span>
        </button>
      </div>

      {/* 帮助信息 */}
      <div className="text-center text-sm text-gray-500">
        <p>没有找到合适的钱包？</p>
        <p className="mt-1">
          <a href="https://ethereum.org/wallets/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            了解如何安装以太坊钱包
          </a>
        </p>
      </div>
    </div>
  )
}