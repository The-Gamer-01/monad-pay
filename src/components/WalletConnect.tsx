'use client'

export default function WalletConnect() {
  const handleConnect = () => {
    alert('钱包连接功能正在开发中...')
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
    >
      连接钱包
    </button>
  )
}