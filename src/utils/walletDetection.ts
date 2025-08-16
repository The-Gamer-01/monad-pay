/**
 * 钱包检测和深度链接工具
 * 支持多种钱包的检测、深度链接生成和智能回退机制
 */

export interface WalletInfo {
  id: string
  name: string
  displayName: string
  icon: string
  color: string
  schemes: string[]
  universalLinks: string[]
  downloadUrl: string
  supportedPlatforms: ('ios' | 'android' | 'desktop' | 'web')[]
  priority: number // 优先级，数字越小优先级越高
}

export interface DeepLinkParams {
  to: string
  amount: string
  token: string
  chainId: string
  message?: string
  label?: string
  data?: string
}

export interface WalletDetectionResult {
  installed: boolean
  supported: boolean
  deepLink: string
  fallbackLink: string
  confidence: number // 0-1，检测置信度
}

// 支持的钱包配置
export const SUPPORTED_WALLETS: Record<string, WalletInfo> = {
  metamask: {
    id: 'metamask',
    name: 'MetaMask',
    displayName: 'MetaMask',
    icon: '🦊',
    color: 'bg-orange-500',
    schemes: ['metamask://'],
    universalLinks: ['https://metamask.app.link'],
    downloadUrl: 'https://metamask.io/download/',
    supportedPlatforms: ['ios', 'android', 'desktop', 'web'],
    priority: 1
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    displayName: 'Rainbow Wallet',
    icon: '🌈',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    schemes: ['rainbow://'],
    universalLinks: ['https://rnbwapp.com'],
    downloadUrl: 'https://rainbow.me/',
    supportedPlatforms: ['ios', 'android'],
    priority: 2
  },
  rabby: {
    id: 'rabby',
    name: 'Rabby',
    displayName: 'Rabby Wallet',
    icon: '🐰',
    color: 'bg-blue-500',
    schemes: ['rabby://'],
    universalLinks: ['https://rabby.io'],
    downloadUrl: 'https://rabby.io/',
    supportedPlatforms: ['desktop', 'web'],
    priority: 3
  },
  coinbase: {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    displayName: 'Coinbase Wallet',
    icon: '💙',
    color: 'bg-blue-600',
    schemes: ['cbwallet://'],
    universalLinks: ['https://go.cb-w.com'],
    downloadUrl: 'https://www.coinbase.com/wallet',
    supportedPlatforms: ['ios', 'android', 'web'],
    priority: 4
  },
  trustwallet: {
    id: 'trustwallet',
    name: 'Trust Wallet',
    displayName: 'Trust Wallet',
    icon: '🛡️',
    color: 'bg-blue-400',
    schemes: ['trust://'],
    universalLinks: ['https://link.trustwallet.com'],
    downloadUrl: 'https://trustwallet.com/',
    supportedPlatforms: ['ios', 'android'],
    priority: 5
  },
  walletconnect: {
    id: 'walletconnect',
    name: 'WalletConnect',
    displayName: 'WalletConnect',
    icon: '🔗',
    color: 'bg-indigo-500',
    schemes: ['wc://'],
    universalLinks: ['https://walletconnect.com'],
    downloadUrl: 'https://walletconnect.com/wallets',
    supportedPlatforms: ['ios', 'android', 'desktop', 'web'],
    priority: 6
  },
  imtoken: {
    id: 'imtoken',
    name: 'imToken',
    displayName: 'imToken',
    icon: '💎',
    color: 'bg-green-500',
    schemes: ['imtokenv2://'],
    universalLinks: ['https://token.im'],
    downloadUrl: 'https://token.im/',
    supportedPlatforms: ['ios', 'android'],
    priority: 7
  },
  tokenpocket: {
    id: 'tokenpocket',
    name: 'TokenPocket',
    displayName: 'TokenPocket',
    icon: '🎒',
    color: 'bg-purple-500',
    schemes: ['tpoutside://'],
    universalLinks: ['https://www.tokenpocket.pro'],
    downloadUrl: 'https://www.tokenpocket.pro/',
    supportedPlatforms: ['ios', 'android', 'desktop'],
    priority: 8
  },
  mathwallet: {
    id: 'mathwallet',
    name: 'MathWallet',
    displayName: 'MathWallet',
    icon: '🧮',
    color: 'bg-yellow-500',
    schemes: ['mathwallet://'],
    universalLinks: ['https://mathwallet.org'],
    downloadUrl: 'https://mathwallet.org/',
    supportedPlatforms: ['ios', 'android', 'desktop', 'web'],
    priority: 9
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    displayName: 'Phantom Wallet',
    icon: '👻',
    color: 'bg-purple-600',
    schemes: ['phantom://'],
    universalLinks: ['https://phantom.app'],
    downloadUrl: 'https://phantom.app/',
    supportedPlatforms: ['ios', 'android', 'desktop', 'web'],
    priority: 10
  }
}

/**
 * 检测设备类型
 */
export function detectPlatform(): 'ios' | 'android' | 'desktop' | 'web' {
  if (typeof window === 'undefined') return 'web'
  
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios'
  } else if (/android/.test(userAgent)) {
    return 'android'
  } else if (/electron/.test(userAgent)) {
    return 'desktop'
  } else {
    return 'web'
  }
}

/**
 * 检测是否为移动设备
 */
export function isMobile(): boolean {
  const platform = detectPlatform()
  return platform === 'ios' || platform === 'android'
}

/**
 * 检测钱包是否已安装
 */
export async function detectWalletInstallation(walletId: string): Promise<WalletDetectionResult> {
  const wallet = SUPPORTED_WALLETS[walletId]
  if (!wallet) {
    return {
      installed: false,
      supported: false,
      deepLink: '',
      fallbackLink: '',
      confidence: 0
    }
  }

  const platform = detectPlatform()
  const supported = wallet.supportedPlatforms.includes(platform)
  
  if (!supported) {
    return {
      installed: false,
      supported: false,
      deepLink: '',
      fallbackLink: wallet.downloadUrl,
      confidence: 0
    }
  }

  let installed = false
  let confidence = 0

  // Web 环境检测
  if (platform === 'web' || platform === 'desktop') {
    // 检测 window.ethereum 或其他钱包注入的对象
    if (typeof window !== 'undefined') {
      switch (walletId) {
        case 'metamask':
          installed = !!(window as any).ethereum?.isMetaMask
          confidence = installed ? 0.9 : 0.1
          break
        case 'coinbase':
          installed = !!(window as any).ethereum?.isCoinbaseWallet
          confidence = installed ? 0.9 : 0.1
          break
        case 'rabby':
          installed = !!(window as any).ethereum?.isRabby
          confidence = installed ? 0.9 : 0.1
          break
        default:
          // 通用检测：检查是否有 ethereum 对象
          installed = !!(window as any).ethereum
          confidence = installed ? 0.3 : 0.1
      }
    }
  } else {
    // 移动端：假设可能已安装，通过深度链接测试
    installed = true
    confidence = 0.5 // 移动端无法准确检测，给中等置信度
  }

  return {
    installed,
    supported,
    deepLink: '',
    fallbackLink: wallet.downloadUrl,
    confidence
  }
}

/**
 * 生成钱包深度链接
 */
export function generateWalletDeepLink(
  walletId: string,
  params: DeepLinkParams,
  fallbackUrl?: string
): string {
  const wallet = SUPPORTED_WALLETS[walletId]
  if (!wallet) return fallbackUrl || ''

  const { to, amount, token, chainId, message, label } = params
  const amountInWei = (parseFloat(amount) * 1e18).toString()
  const platform = detectPlatform()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pay.monad.link'
  const paymentUrl = `${baseUrl}/pay?to=${to}&amount=${amount}&token=${token}&chainId=${chainId}${message ? `&message=${encodeURIComponent(message)}` : ''}${label ? `&label=${encodeURIComponent(label)}` : ''}`

  switch (walletId) {
    case 'metamask':
      if (platform === 'ios' || platform === 'android') {
        return `https://metamask.app.link/send/${to}@${chainId}?value=${amountInWei}`
      } else {
        return `https://metamask.app.link/dapp/${baseUrl.replace('https://', '')}/pay?to=${to}&amount=${amount}&token=${token}&chainId=${chainId}`
      }

    case 'rainbow':
      return `https://rnbwapp.com/send?address=${to}&amount=${amount}&chainId=${chainId}`

    case 'rabby':
      return `https://rabby.io/send?to=${to}&value=${amountInWei}&chainId=${chainId}`

    case 'coinbase':
      return `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(paymentUrl)}`

    case 'trustwallet':
      return `https://link.trustwallet.com/send?coin=60&address=${to}&amount=${amount}`

    case 'walletconnect':
      return `wc:${to}@${chainId}?methods=eth_sendTransaction&events=accountsChanged,chainChanged&amount=${amountInWei}&token=${token}`

    case 'imtoken':
      return `imtokenv2://navigate/DappView?url=${encodeURIComponent(paymentUrl)}`

    case 'tokenpocket':
      return `tpoutside://open?param=${encodeURIComponent(JSON.stringify({ url: paymentUrl, chain: chainId }))}`

    case 'mathwallet':
      return `mathwallet://dapp?url=${encodeURIComponent(paymentUrl)}`

    case 'phantom':
      return `phantom://browse/${encodeURIComponent(paymentUrl)}`

    default:
      return fallbackUrl || paymentUrl
  }
}

/**
 * 获取推荐的钱包列表（根据平台和优先级排序）
 */
export function getRecommendedWallets(limit?: number): WalletInfo[] {
  const platform = detectPlatform()
  
  const compatibleWallets = Object.values(SUPPORTED_WALLETS)
    .filter(wallet => wallet.supportedPlatforms.includes(platform))
    .sort((a, b) => a.priority - b.priority)
  
  return limit ? compatibleWallets.slice(0, limit) : compatibleWallets
}

/**
 * 尝试打开钱包深度链接，带有智能回退机制
 */
export async function openWalletWithFallback(
  walletId: string,
  params: DeepLinkParams,
  options: {
    fallbackUrl?: string
    timeout?: number
    onFallback?: () => void
    onSuccess?: () => void
    onError?: (error: Error) => void
  } = {}
): Promise<boolean> {
  const {
    fallbackUrl,
    timeout = 2000,
    onFallback,
    onSuccess,
    onError
  } = options

  try {
    const detection = await detectWalletInstallation(walletId)
    const deepLink = generateWalletDeepLink(walletId, params, fallbackUrl)
    
    if (!detection.supported) {
      throw new Error(`Wallet ${walletId} is not supported on this platform`)
    }

    if (isMobile()) {
      // 移动端：尝试深度链接
      const startTime = Date.now()
      let fallbackTriggered = false

      // 设置回退定时器
      const fallbackTimer = setTimeout(() => {
        if (!fallbackTriggered) {
          fallbackTriggered = true
          
          if (detection.confidence < 0.7) {
            // 低置信度，询问用户
            const shouldFallback = confirm(
              `未检测到 ${SUPPORTED_WALLETS[walletId]?.displayName}，是否在浏览器中打开支付页面？`
            )
            
            if (shouldFallback && fallbackUrl) {
              window.open(fallbackUrl, '_blank')
              onFallback?.()
            }
          } else if (fallbackUrl) {
            // 高置信度但超时，直接回退
            window.open(fallbackUrl, '_blank')
            onFallback?.()
          }
        }
      }, timeout)

      // 监听页面可见性变化（用户切换到钱包应用时页面会隐藏）
      const handleVisibilityChange = () => {
        if (document.hidden && Date.now() - startTime < timeout) {
          clearTimeout(fallbackTimer)
          fallbackTriggered = true
          onSuccess?.()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // 尝试打开深度链接
      window.location.href = deepLink
      
      // 清理事件监听器
      setTimeout(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }, timeout + 1000)
      
      return true
    } else {
      // 桌面端：直接打开回退链接或深度链接
      if (detection.installed && detection.confidence > 0.7) {
        window.location.href = deepLink
        onSuccess?.()
      } else if (fallbackUrl) {
        window.open(fallbackUrl, '_blank')
        onFallback?.()
      } else {
        window.location.href = deepLink
      }
      
      return true
    }
  } catch (error) {
    console.error(`Failed to open wallet ${walletId}:`, error)
    onError?.(error as Error)
    
    // 最后的回退：打开回退链接
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank')
      onFallback?.()
    }
    
    return false
  }
}

/**
 * 生成 NFC 数据
 */
export function generateNFCData(params: DeepLinkParams, options: {
  title?: string
  description?: string
  protocol?: 'monadpay' | 'https'
} = {}): string {
  const { title, description, protocol = 'https' } = options
  const { to, amount, token, chainId, message, label } = params
  
  const baseUrl = protocol === 'monadpay' 
    ? 'monadpay://pay'
    : 'https://pay.monad.link/pay'
  
  const url = `${baseUrl}?to=${to}&amount=${amount}&token=${token}&chainId=${chainId}${message ? `&message=${encodeURIComponent(message)}` : ''}${label ? `&label=${encodeURIComponent(label)}` : ''}`
  
  const nfcData = {
    type: 'url',
    url,
    title: title || `MonadPay: ${amount} ${token}`,
    description: description || `Pay ${amount} ${token} to ${to.slice(0, 6)}...${to.slice(-4)}`,
    timestamp: Date.now(),
    version: '1.0'
  }
  
  return JSON.stringify(nfcData, null, 2)
}