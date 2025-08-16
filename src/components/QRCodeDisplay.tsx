'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  link: string
}

export default function QRCodeDisplay({ link }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (link && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, link, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    }
  }, [link])

  const copyToClipboard = async () => {
    if (link) {
      try {
        await navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    }
  }

  const openInWallet = () => {
    if (link) {
      // 尝试打开深度链接
      window.location.href = link
    }
  }

  if (!link) {
    return (
      <div className="text-center py-12">
        <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01M12 8h4.01M12 8H7.99M12 8V4m0 0H7.99M12 4h4.01" />
          </svg>
        </div>
        <p className="text-gray-500">生成链接后将显示二维码</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <div className="text-center">
        <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
          <canvas ref={canvasRef} className="max-w-full h-auto" />
        </div>
      </div>

      {/* Link Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          生成的链接
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={link}
            readOnly
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
          />
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              copied
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {copied ? '已复制!' : '复制'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={openInWallet}
          className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
        >
          在钱包中打开
        </button>
        <button
          onClick={copyToClipboard}
          className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
        >
          分享链接
        </button>
      </div>

      {/* Link Analysis */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">链接解析</h3>
        <div className="space-y-1 text-sm">
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
  )
}