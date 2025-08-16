'use client'

import { useState, useEffect } from 'react'
import LinkGenerator from '../../components/LinkGenerator'
import QRCodeDisplay from '../../components/QRCodeDisplay'

export default function TestDeeplink() {
  const [generatedLink, setGeneratedLink] = useState<string>('')

  const [testLinks, setTestLinks] = useState<Array<{name: string, link: string}>>([])

  // 在客户端设置测试链接
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTestLinks([
        {
          name: 'MON 测试支付',
          link: `${window.location.origin}/pay?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=1&token=MON&label=测试支付&message=这是一个MON测试支付`
        },
        {
          name: 'ETH 小额支付',
          link: `${window.location.origin}/pay?to=0x742d35Cc6634C0532925a3b8D4C9db96590c6C87&amount=0.01&token=ETH&label=小额支付`
        }
      ])
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          深度链接测试页面
        </h1>
        <p className="text-xl text-gray-600">
          测试钱包深度链接功能，支持移动端和桌面端
        </p>
      </div>

      {/* 预设测试链接 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">快速测试</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {testLinks.map((test, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{test.name}</h3>
              <QRCodeDisplay link={test.link} />
            </div>
          ))}
        </div>
      </div>

      {/* 自定义链接生成 */}
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">生成自定义链接</h2>
          <LinkGenerator onLinkGenerated={setGeneratedLink} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">测试结果</h2>
          <QRCodeDisplay link={generatedLink} />
        </div>
      </div>

      {/* 使用说明 */}
      <div className="mt-12 bg-blue-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-6">测试说明</h2>
        <div className="space-y-4 text-blue-800">
          <div>
            <h3 className="font-semibold mb-2">🖥️ 桌面端测试：</h3>
            <p>点击"在钱包中打开"按钮，会在新标签页中打开支付页面</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📱 移动端测试：</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>点击"在钱包中打开"按钮，会尝试打开 MetaMask 应用</li>
              <li>如果没有安装 MetaMask，会提示选择其他钱包或在浏览器中打开</li>
              <li>扫描二维码也会触发相同的深度链接逻辑</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">🔗 支持的钱包：</h3>
            <p>MetaMask, Trust Wallet, Rainbow, Coinbase Wallet 等主流钱包</p>
          </div>
        </div>
      </div>
    </div>
  )
}