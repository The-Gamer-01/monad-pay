'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  SUPPORTED_WALLETS,
  WalletInfo,
  DeepLinkParams,
  WalletDetectionResult,
  detectWalletInstallation,
  generateWalletDeepLink,
  openWalletWithFallback,
  getRecommendedWallets,
  generateNFCData,
  isMobile,
  detectPlatform
} from '../utils/walletDetection'
import MobileWalletSelector from './MobileWalletSelector'

interface WalletConnectDeepLinkProps {
  to: string
  amount: string
  token: string
  chainId?: string
  message?: string
  label?: string
  onLinkGenerated?: (links: DeepLinkCollection) => void
}

interface DeepLinkCollection {
  walletConnect: string
  monadPay: string
  metamask: string
  rainbow: string
  rabby: string
  coinbase: string
  trustWallet: string
  fallback: string
  nfc: string
  qrCode?: string
}

interface WalletStatus {
  wallet: WalletInfo
  detection: WalletDetectionResult
  deepLink: string
}

export default function WalletConnectDeepLink({
  to,
  amount,
  token,
  chainId = '10143', // 默认 Monad 测试网
  message,
  label,
  onLinkGenerated
}: WalletConnectDeepLinkProps) {
  const [links, setLinks] = useState<DeepLinkCollection | null>(null)
  const [walletStatuses, setWalletStatuses] = useState<WalletStatus[]>([])
  const [selectedWallet, setSelectedWallet] = useState<string>('metamask')
  const [showAllWallets, setShowAllWallets] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [copied, setCopied] = useState<string>('')
  const [isDetecting, setIsDetecting] = useState(true)
  const [platform] = useState(detectPlatform())
  const [mobile] = useState(isMobile())
  const [useMobileSelector, setUseMobileSelector] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    generateDeepLinks()
    if (!mobile) {
      detectWallets()
    } else {
      setUseMobileSelector(true)
    }
  }, [to, amount, token, chainId, message, label, mobile])

  const detectWallets = async () => {
    setIsDetecting(true)
    const recommendedWallets = getRecommendedWallets()
    const statuses: WalletStatus[] = []
    
    const params: DeepLinkParams = {
      to,
      amount,
      token,
      chainId,
      message,
      label
    }
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pay.monad.link'
    const fallbackUrl = `${baseUrl}/pay?to=${to}&amount=${amount}&token=${token}&chainId=${chainId}${message ? `&message=${encodeURIComponent(message)}` : ''}${label ? `&label=${encodeURIComponent(label)}` : ''}`
    
    for (const wallet of recommendedWallets) {
      try {
        const detection = await detectWalletInstallation(wallet.id)
        const deepLink = generateWalletDeepLink(wallet.id, params, fallbackUrl)
        
        statuses.push({
          wallet,
          detection,
          deepLink
        })
      } catch (error) {
        console.error(`Failed to detect wallet ${wallet.id}:`, error)
      }
    }
    
    // 按置信度和优先级排序
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
    setIsDetecting(false)
  }

  const generateDeepLinks = async () => {
    if (!to || !amount) return

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pay.monad.link'
    const amountInWei = (parseFloat(amount) * 1e18).toString()
    
    // 构建基础参数
    const params = new URLSearchParams({
      to,
      amount,
      token,
      chainId
    })
    
    if (message) params.append('message', message)
    if (label) params.append('label', label)
    
    const paymentUrl = `${baseUrl}/pay?${params.toString()}`
    
    // 生成各种深度链接
    const deepLinks: DeepLinkCollection = {
      // WalletConnect URI 格式
      walletConnect: `wc:${to}@${chainId}?methods=eth_sendTransaction&events=accountsChanged,chainChanged&amount=${amountInWei}&token=${token}`,
      
      // MonadPay 自定义协议
      monadPay: `monadpay://send?${params.toString()}`,
      
      // MetaMask 深度链接
      metamask: generateWalletDeepLink('metamask', { to, amount, token, chainId, message, label }, paymentUrl),
      
      // Rainbow 深度链接
      rainbow: generateWalletDeepLink('rainbow', { to, amount, token, chainId, message, label }, paymentUrl),
      
      // Rabby 深度链接
      rabby: generateWalletDeepLink('rabby', { to, amount, token, chainId, message, label }, paymentUrl),
      
      // Coinbase Wallet 深度链接
      coinbase: generateWalletDeepLink('coinbase', { to, amount, token, chainId, message, label }, paymentUrl),
      
      // Trust Wallet 深度链接
      trustWallet: generateWalletDeepLink('trustwallet', { to, amount, token, chainId, message, label }, paymentUrl),
      
      // 回退到网页版本
      fallback: paymentUrl,
      
      // NFC 编码链接（使用最通用的格式）
      nfc: `https://pay.monad.link/pay?${params.toString()}`
    }
    
    // 生成二维码
    try {
      const qrDataUrl = await QRCode.toDataURL(deepLinks.monadPay, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(qrDataUrl)
      deepLinks.qrCode = qrDataUrl
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
    
    setLinks(deepLinks)
    onLinkGenerated?.(deepLinks)
  }

  const openInWallet = async (walletId: string) => {
    if (!links) return
    
    const params: DeepLinkParams = {
      to,
      amount,
      token,
      chainId,
      message,
      label
    }
    
    const success = await openWalletWithFallback(walletId, params, {
      fallbackUrl: links.fallback,
      timeout: 3000,
      onSuccess: () => {
        console.log(`Successfully opened ${walletId}`)
      },
      onFallback: () => {
        console.log(`Fallback triggered for ${walletId}`)
      },
      onError: (error) => {
        console.error(`Error opening ${walletId}:`, error)
      }
    })
    
    if (!success) {
      // 最后的回退：直接打开网页版本
      window.open(links.fallback, '_blank')
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadNFC = () => {
    if (!links) return
    
    const params: DeepLinkParams = {
      to,
      amount,
      token,
      chainId,
      message,
      label
    }
    
    const nfcData = generateNFCData(params, {
      title: label || 'MonadPay Payment',
      description: message || `Pay ${amount} ${token} to ${to.slice(0, 6)}...${to.slice(-4)}`,
      protocol: 'https'
    })
    
    const blob = new Blob([nfcData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'monadpay-nfc-data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const getWalletStatusIcon = (status: WalletStatus) => {
    if (status.detection.installed && status.detection.confidence > 0.7) {
      return '✅' // 已安装且高置信度
    } else if (status.detection.supported) {
      return '❓' // 支持但未确认安装
    } else {
      return '❌' // 不支持
    }
  }
  
  const getWalletStatusText = (status: WalletStatus) => {
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

  if (!links || isDetecting) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">
          {isDetecting ? '检测钱包中...' : '生成深度链接中...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <div className="text-center">
        <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-64 h-64" />
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">生成二维码中...</span>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">扫描二维码或选择钱包打开</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-700 text-sm">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 移动端优化选择器 */}
      {mobile && useMobileSelector ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">选择钱包</h3>
            <button
              onClick={() => setUseMobileSelector(false)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              切换到桌面版
            </button>
          </div>
          <MobileWalletSelector
            params={{
              to,
              amount,
              token,
              chainId,
              message,
              label
            }}
            fallbackUrl={links?.fallback || ''}
            onWalletSelected={(walletId) => {
              console.log(`Selected wallet: ${walletId}`)
            }}
            onError={(error) => {
              setError(error)
            }}
          />
        </div>
      ) : (
        <div>
          {/* 平台信息和切换选项 */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">检测到平台: <span className="font-medium">{platform}</span></span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">设备类型: <span className="font-medium">{mobile ? '移动端' : '桌面端'}</span></span>
                {mobile && (
                  <button
                    onClick={() => setUseMobileSelector(true)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    优化版
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 智能钱包推荐 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {walletStatuses.slice(0, showAllWallets ? undefined : 6).map((status) => {
              const isRecommended = status.detection.installed && status.detection.confidence > 0.7
              const isSupported = status.detection.supported
              
              return (
                <button
                  key={status.wallet.id}
                  onClick={() => openInWallet(status.wallet.id)}
                  disabled={!isSupported}
                  className={`${status.wallet.color} ${!isSupported ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} 
                    text-white p-4 rounded-lg transition-all duration-200 flex flex-col items-center space-y-2 relative`}
                >
                  {/* 状态指示器 */}
                  <div className="absolute top-2 right-2 text-xs">
                    {getWalletStatusIcon(status)}
                  </div>
                  
                  {/* 推荐标签 */}
                  {isRecommended && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      推荐
                    </div>
                  )}
                  
                  <span className="text-2xl">{status.wallet.icon}</span>
                  <span className="text-sm font-medium">{status.wallet.displayName}</span>
                  <span className="text-xs opacity-75">{getWalletStatusText(status)}</span>
                  
                  {/* 置信度指示器 */}
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-1">
                    <div 
                      className="bg-white h-1 rounded-full transition-all duration-300"
                      style={{ width: `${status.detection.confidence * 100}%` }}
                    ></div>
                  </div>
                </button>
              )
            })}
          </div>

          {!showAllWallets && walletStatuses.length > 6 && (
            <button
              onClick={() => setShowAllWallets(true)}
              className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              显示更多钱包 ({walletStatuses.length - 6} 个) ↓
            </button>
          )}
        </div>
      )}

      {/* 链接详情 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900">深度链接详情</h3>
        
        {/* WalletConnect URI */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">WalletConnect URI</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={links.walletConnect}
              readOnly
              className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded font-mono"
            />
            <button
              onClick={() => copyToClipboard(links.walletConnect, 'walletConnect')}
              className={`px-2 py-1 text-xs rounded ${
                copied === 'walletConnect' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied === 'walletConnect' ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        {/* MonadPay 协议 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">MonadPay 协议</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={links.monadPay}
              readOnly
              className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded font-mono"
            />
            <button
              onClick={() => copyToClipboard(links.monadPay, 'monadPay')}
              className={`px-2 py-1 text-xs rounded ${
                copied === 'monadPay' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied === 'monadPay' ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        {/* 回退链接 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">网页回退链接</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={links.fallback}
              readOnly
              className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded font-mono"
            />
            <button
              onClick={() => copyToClipboard(links.fallback, 'fallback')}
              className={`px-2 py-1 text-xs rounded ${
                copied === 'fallback' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied === 'fallback' ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      </div>

      {/* NFC 支持 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center">
          📱 NFC 支持
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          将支付链接编码到 NFC 芯片中，用于商家收款或线下活动。
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={downloadNFC}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            📥 下载 NFC 数据
          </button>
          <button
            onClick={() => copyToClipboard(links.nfc, 'nfc')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              copied === 'nfc' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {copied === 'nfc' ? '已复制 NFC 链接' : '🔗 复制 NFC 链接'}
          </button>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">💡 使用说明</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• <strong>移动端</strong>：点击钱包按钮直接唤起对应钱包应用</li>
          <li>• <strong>桌面端</strong>：将跳转到网页版支付页面</li>
          <li>• <strong>二维码</strong>：使用钱包应用扫描二维码进行支付</li>
          <li>• <strong>NFC</strong>：将链接写入 NFC 芯片，支持近场通信支付</li>
          <li>• <strong>回退机制</strong>：如果钱包应用未安装，自动跳转到网页版本</li>
        </ul>
      </div>
    </div>
  )
}