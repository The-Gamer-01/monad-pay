'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { useState } from 'react'
import { mainnet, arbitrum, polygon } from '@reown/appkit/networks'

const networks = [
  { id: mainnet.id, name: 'Ethereum', symbol: 'ETH' },
  { id: arbitrum.id, name: 'Arbitrum', symbol: 'ETH' },
  { id: polygon.id, name: 'Polygon', symbol: 'MATIC' },
  { id: 10143, name: 'Monad Testnet', symbol: 'MON' }
]

export default function NetworkSwitcher() {
  const { chain, isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const [isOpen, setIsOpen] = useState(false)

  if (!isConnected) {
    return null
  }

  const currentNetwork = networks.find(network => network.id === chain?.id)

  const handleNetworkSwitch = async (chainId: number) => {
    try {
      await switchChain({ chainId })
      setIsOpen(false)
    } catch (error) {
      console.error('网络切换失败:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-3 sm:py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation min-h-[44px] sm:min-h-0 w-full sm:w-auto"
        disabled={isPending}
      >
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="flex-1 text-left sm:flex-initial sm:text-center">{currentNetwork?.name || '未知网络'}</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10 sm:hidden" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-full sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => handleNetworkSwitch(network.id)}
                  className={`w-full text-left px-4 py-3 sm:py-2 text-sm hover:bg-gray-100 active:bg-gray-200 flex items-center gap-3 touch-manipulation min-h-[44px] sm:min-h-0 ${
                    currentNetwork?.id === network.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                  disabled={isPending}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    currentNetwork?.id === network.id ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium">{network.name}</div>
                    <div className="text-xs text-gray-500">{network.symbol}</div>
                  </div>
                  {currentNetwork?.id === network.id && (
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}