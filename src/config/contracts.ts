// MonadPay 合约配置
export const CONTRACTS = {
  MONAD_PAY: {
    // Monad 测试网
    10143: '0x896ecD588cCe3b4F4D14E5c20620463b421EE2B6',
    // 可以在这里添加其他网络的合约地址
    // 1: '0x...', // 以太坊主网
    // 137: '0x...', // Polygon
  }
} as const;

// 获取当前网络的合约地址
export function getContractAddress(chainId: number): string | undefined {
  return CONTRACTS.MONAD_PAY[chainId as keyof typeof CONTRACTS.MONAD_PAY];
}

// 部署信息
export const DEPLOYMENT_INFO = {
  MONAD_TESTNET: {
    contractAddress: '0x896ecD588cCe3b4F4D14E5c20620463b421EE2B6',
    deployerAddress: '0xF401F99D78BDDF2b8C22c078dBeFB2Fb758f6b46',
    transactionHash: '0x2452f1a51873bd11f9123845d245956d7ce1482c9f5d6b546895b4036380af70',
    blockNumber: 31090832,
    deploymentCost: '0.8 MON',
    timestamp: '2025-08-16T09:23:33.029Z',
    explorerUrl: 'https://testnet-explorer.monad.xyz/address/0x896ecD588cCe3b4F4D14E5c20620463b421EE2B6'
  }
} as const;