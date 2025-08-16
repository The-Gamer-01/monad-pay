'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import WalletConnectDeepLink from './WalletConnectDeepLink'

interface QRCodeDisplayProps {
  link: string
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

export default function QRCodeDisplay({ link }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [linkData, setLinkData] = useState<any>(null)
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  const [useWalletConnect, setUseWalletConnect] = useState(true)
  const [deepLinks, setDeepLinks] = useState<DeepLinkCollection | null>(null)

  useEffect(() => {
    let qrCodeLink = link
    let parsedData = null
    
    // 尝试解析 JSON 格式的链接数据
    if (link) {
      try {
        const linkDataObj = JSON.parse(link)
        if (linkDataObj.monadpay) {
          qrCodeLink = linkDataObj.monadpay // 优先使用 monadpay:// 深度链接
        } else if (linkDataObj.web) {
          qrCodeLink = linkDataObj.web // 回退到 web 链接
        }
        
        // 从参数中提取数据
        if (linkDataObj.params) {
          parsedData = linkDataObj.params
        }
      } catch (error) {
        // 如果不是 JSON，尝试作为 URL 解析
        try {
          const url = new URL(link)
          const params = url.searchParams
          parsedData = {
            to: params.get('to'),
            amount: params.get('amount'),
            token: params.get('token'),
            chainId: params.get('chainId'),
            message: params.get('message'),
            label: params.get('label')
          }
        } catch (urlError) {
          console.error('Failed to parse link as URL:', urlError)
        }
      }
    }
    
    // 生成二维码
    if (qrCodeLink && canvasRef.current && !useWalletConnect) {
      QRCode.toCanvas(canvasRef.current, qrCodeLink, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    }
    
    // 设置解析后的数据
    if (parsedData) {
      setLinkData(parsedData)
    }
  }, [link, useWalletConnect])

  const copyToClipboard = async () => {
    if (link) {
      try {
        let copyLink = link
        
        // 如果是 JSON 格式，优先复制 monadpay:// 深度链接
        try {
          const linkDataObj = JSON.parse(link)
          if (linkDataObj.monadpay) {
            copyLink = linkDataObj.monadpay
          } else if (linkDataObj.web) {
            copyLink = linkDataObj.web
          }
        } catch (error) {
          // 如果不是 JSON，直接使用原链接
        }
        
        await navigator.clipboard.writeText(copyLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    }
  }

  const openInWallet = () => {
    if (link) {
      try {
        // 解析链接参数
        const url = new URL(link)
        const params = url.searchParams
        const to = params.get('to')
        const amount = params.get('amount')
        const token = params.get('token')
        // 根据token类型确定链ID
        let chainId = params.get('chainId')
        if (!chainId) {
          // 根据代币类型推断链ID
          switch (token?.toUpperCase()) {
            case 'MON':
              chainId = '10143' // Monad 测试网
              break
            case 'ETH':
              chainId = '1' // 以太坊主网
              break
            case 'MATIC':
              chainId = '137' // Polygon
              break
            case 'ARB':
              chainId = '42161' // Arbitrum
              break
            default:
              chainId = '1' // 默认以太坊主网
          }
        }
        
        if (to && amount) {
          // 检测移动设备
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          
          if (isMobile) {
             // 移动端：智能钱包深度链接处理
             const amountInWei = (parseFloat(amount) * 1e18).toString()
             
             // 构建不同钱包的深度链接
             const walletLinks = {
               metamask: `https://metamask.app.link/send/${to}@${chainId}?value=${amountInWei}`,
               trustwallet: `https://link.trustwallet.com/send?coin=60&address=${to}&amount=${amount}`,
               rainbow: `https://rnbwapp.com/send?address=${to}&amount=${amount}&chainId=${chainId}`,
               coinbase: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.origin + '/pay?' + params.toString())}`,
               // 通用深度链接作为后备
               universal: `https://metamask.app.link/dapp/${window.location.origin}/pay?${params.toString()}`
             }
             
             // 优先尝试 MetaMask（最常用）
             try {
               window.location.href = walletLinks.metamask
               
               // 设置后备方案：如果主要钱包没有响应，显示选择界面
               setTimeout(() => {
                 if (confirm('未检测到 MetaMask，是否尝试其他钱包或在浏览器中打开？')) {
                   window.open(walletLinks.universal, '_blank')
                 }
               }, 2000)
             } catch (error) {
               console.error('Failed to open primary wallet:', error)
               window.open(walletLinks.universal, '_blank')
             }
           } else {
            // 桌面端：直接跳转到支付页面
            const paymentUrl = `${window.location.origin}/pay?${params.toString()}`
            window.open(paymentUrl, '_blank')
          }
        }
      } catch (error) {
        console.error('Failed to open wallet:', error)
        // 降级处理：直接跳转到支付页面
        const url = new URL(link)
        const params = url.searchParams
        const paymentUrl = `${window.location.origin}/pay?${params.toString()}`
        window.open(paymentUrl, '_blank')
      }
    }
  }

  const handleDeepLinksGenerated = (links: DeepLinkCollection) => {
    setDeepLinks(links)
  }

  if (!link) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01M12 8h4.01M12 8H7.99M12 8V4m0 0H7.99M12 4h4.01" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm sm:text-base">生成链接后将显示二维码</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 模式切换 */}
      <div className="flex items-center justify-center space-x-4 p-3 bg-gray-50 rounded-lg">
        <button
          onClick={() => setUseWalletConnect(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            useWalletConnect
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          🔗 WalletConnect 深度链接
        </button>
        <button
          onClick={() => setUseWalletConnect(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !useWalletConnect
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          📱 传统二维码
        </button>
      </div>

      {/* WalletConnect 深度链接模式 */}
      {useWalletConnect && linkData?.to && linkData?.amount ? (
        <WalletConnectDeepLink
          to={linkData.to}
          amount={linkData.amount}
          token={linkData.token || 'MON'}
          chainId={linkData.chainId}
          message={linkData.message}
          label={linkData.label}
          onLinkGenerated={handleDeepLinksGenerated}
        />
      ) : useWalletConnect ? (
        <div className="text-center py-8">
          <p className="text-gray-500">解析链接参数中...</p>
        </div>
      ) : null}

      {/* 传统二维码模式 */}
      {!useWalletConnect && (
        <div>
          {/* QR Code - 移动端优化 */}
          <div className="text-center">
            <div className="inline-block p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
          </div>

          {/* Link Display - 移动端优化 */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生成的链接
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={link}
                readOnly
                className="flex-1 px-3 py-3 sm:py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                  copied
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copied ? '已复制!' : '复制'}
              </button>
            </div>
          </div>

          {/* Action Buttons - 移动端优化 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={openInWallet}
              className="bg-blue-600 text-white py-4 sm:py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-base sm:text-sm touch-manipulation"
            >
              📱 在钱包中打开
            </button>
            <button
              onClick={copyToClipboard}
              className="bg-gray-100 text-gray-700 py-4 sm:py-3 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium text-base sm:text-sm touch-manipulation"
            >
              🔗 分享链接
            </button>
          </div>

          {/* Link Analysis - 移动端优化 */}
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">链接解析</h3>
            <div className="space-y-1 text-xs sm:text-sm">
              {(() => {
                try {
                  const url = new URL(link)
                  const params = url.searchParams
                  return (
                    <>
                      <div><span className="text-blue-700 font-medium">协议:</span> {url.protocol}</div>
                      <div><span className="text-blue-700 font-medium">操作:</span> {url.pathname.replace('/', '')}</div>
                      <div><span className="text-blue-700 font-medium">收款地址:</span> {params.get('to')}</div>
                      <div><span className="text-blue-700 font-medium">金额:</span> {params.get('amount')} {params.get('token')}</div>
                      {params.get('label') && (
                        <div><span className="text-blue-700 font-medium">标签:</span> {params.get('label')}</div>
                      )}
                      {params.get('message') && (
                        <div><span className="text-blue-700 font-medium">消息:</span> {params.get('message')}</div>
                      )}
                      {params.get('expires') && (
                        <div><span className="text-blue-700 font-medium">过期时间:</span> {new Date(Number(params.get('expires')) * 1000).toLocaleString()}</div>
                      )}
                    </>
                  )
                } catch (e) {
                  return <div className="text-red-600">链接格式错误</div>
                }
              })()
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}