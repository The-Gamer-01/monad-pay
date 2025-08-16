// DeFi 协议预设模板
// 包含常用 DeFi 协议的 ABI 和配置信息

export interface DefiTemplate {
  id: string;
  name: string;
  description: string;
  protocol: string;
  category: 'dex' | 'lending' | 'staking' | 'yield' | 'bridge';
  contractAddress: {
    mainnet?: string;
    polygon?: string;
    arbitrum?: string;
    optimism?: string;
  };
  abi: any[];
  functions: {
    name: string;
    description: string;
    inputs: {
      name: string;
      type: string;
      description: string;
      required: boolean;
    }[];
    gasEstimate: number;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
  icon?: string;
  website?: string;
  documentation?: string;
}

// Uniswap V3 Router 模板
export const UNISWAP_V3_TEMPLATE: DefiTemplate = {
  id: 'uniswap-v3',
  name: 'Uniswap V3',
  description: '去中心化交易所，支持集中流动性',
  protocol: 'Uniswap',
  category: 'dex',
  contractAddress: {
    mainnet: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    polygon: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    arbitrum: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    optimism: '0xE592427A0AEce92De3Edee1F18E0157C05861564'
  },
  abi: [
    {
      "inputs": [
        {
          "components": [
            { "internalType": "address", "name": "tokenIn", "type": "address" },
            { "internalType": "address", "name": "tokenOut", "type": "address" },
            { "internalType": "uint24", "name": "fee", "type": "uint24" },
            { "internalType": "address", "name": "recipient", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" },
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
            { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
          ],
          "internalType": "struct ISwapRouter.ExactInputSingleParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "exactInputSingle",
      "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
      "stateMutability": "payable",
      "type": "function"
    }
  ],
  functions: [
    {
      name: 'exactInputSingle',
      description: '精确输入单次交换',
      inputs: [
        { name: 'tokenIn', type: 'address', description: '输入代币地址', required: true },
        { name: 'tokenOut', type: 'address', description: '输出代币地址', required: true },
        { name: 'fee', type: 'uint24', description: '手续费等级 (500, 3000, 10000)', required: true },
        { name: 'recipient', type: 'address', description: '接收地址', required: true },
        { name: 'deadline', type: 'uint256', description: '截止时间戳', required: true },
        { name: 'amountIn', type: 'uint256', description: '输入数量', required: true },
        { name: 'amountOutMinimum', type: 'uint256', description: '最小输出数量', required: true },
        { name: 'sqrtPriceLimitX96', type: 'uint160', description: '价格限制 (0 表示无限制)', required: false }
      ],
      gasEstimate: 150000,
      riskLevel: 'medium'
    }
  ],
  website: 'https://uniswap.org',
  documentation: 'https://docs.uniswap.org'
};

// AAVE V3 Pool 模板
export const AAVE_V3_TEMPLATE: DefiTemplate = {
  id: 'aave-v3',
  name: 'AAVE V3',
  description: '去中心化借贷协议',
  protocol: 'AAVE',
  category: 'lending',
  contractAddress: {
    mainnet: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    polygon: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    arbitrum: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    optimism: '0x794a61358D6845594F94dc1DB02A252b5b4814aD'
  },
  abi: [
    {
      "inputs": [
        { "internalType": "address", "name": "asset", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" },
        { "internalType": "address", "name": "onBehalfOf", "type": "address" },
        { "internalType": "uint16", "name": "referralCode", "type": "uint16" }
      ],
      "name": "supply",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "asset", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" },
        { "internalType": "address", "name": "to", "type": "address" }
      ],
      "name": "withdraw",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "asset", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" },
        { "internalType": "uint256", "name": "interestRateMode", "type": "uint256" },
        { "internalType": "uint16", "name": "referralCode", "type": "uint16" },
        { "internalType": "address", "name": "onBehalfOf", "type": "address" }
      ],
      "name": "borrow",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  functions: [
    {
      name: 'supply',
      description: '向协议存入资产',
      inputs: [
        { name: 'asset', type: 'address', description: '资产地址', required: true },
        { name: 'amount', type: 'uint256', description: '存入数量', required: true },
        { name: 'onBehalfOf', type: 'address', description: '代表地址', required: true },
        { name: 'referralCode', type: 'uint16', description: '推荐码 (通常为 0)', required: false }
      ],
      gasEstimate: 200000,
      riskLevel: 'low'
    },
    {
      name: 'withdraw',
      description: '从协议提取资产',
      inputs: [
        { name: 'asset', type: 'address', description: '资产地址', required: true },
        { name: 'amount', type: 'uint256', description: '提取数量 (type(uint256).max 表示全部)', required: true },
        { name: 'to', type: 'address', description: '接收地址', required: true }
      ],
      gasEstimate: 180000,
      riskLevel: 'low'
    },
    {
      name: 'borrow',
      description: '从协议借入资产',
      inputs: [
        { name: 'asset', type: 'address', description: '资产地址', required: true },
        { name: 'amount', type: 'uint256', description: '借入数量', required: true },
        { name: 'interestRateMode', type: 'uint256', description: '利率模式 (1=稳定, 2=浮动)', required: true },
        { name: 'referralCode', type: 'uint16', description: '推荐码 (通常为 0)', required: false },
        { name: 'onBehalfOf', type: 'address', description: '代表地址', required: true }
      ],
      gasEstimate: 250000,
      riskLevel: 'high'
    }
  ],
  website: 'https://aave.com',
  documentation: 'https://docs.aave.com'
};

// Compound V3 模板
export const COMPOUND_V3_TEMPLATE: DefiTemplate = {
  id: 'compound-v3',
  name: 'Compound V3',
  description: '去中心化借贷协议',
  protocol: 'Compound',
  category: 'lending',
  contractAddress: {
    mainnet: '0xc3d688B66703497DAA19211EEdff47f25384cdc3', // USDC market
    polygon: '0xF25212E676D1F7F89Cd72fFEe66158f541246445'
  },
  abi: [
    {
      "inputs": [
        { "internalType": "address", "name": "asset", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "supply",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "asset", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  functions: [
    {
      name: 'supply',
      description: '向市场存入资产',
      inputs: [
        { name: 'asset', type: 'address', description: '资产地址', required: true },
        { name: 'amount', type: 'uint256', description: '存入数量', required: true }
      ],
      gasEstimate: 150000,
      riskLevel: 'low'
    },
    {
      name: 'withdraw',
      description: '从市场提取资产',
      inputs: [
        { name: 'asset', type: 'address', description: '资产地址', required: true },
        { name: 'amount', type: 'uint256', description: '提取数量', required: true }
      ],
      gasEstimate: 120000,
      riskLevel: 'low'
    }
  ],
  website: 'https://compound.finance',
  documentation: 'https://docs.compound.finance'
};

// Lido Staking 模板
export const LIDO_TEMPLATE: DefiTemplate = {
  id: 'lido-steth',
  name: 'Lido stETH',
  description: '以太坊流动性质押',
  protocol: 'Lido',
  category: 'staking',
  contractAddress: {
    mainnet: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'
  },
  abi: [
    {
      "inputs": [
        { "internalType": "address", "name": "_referral", "type": "address" }
      ],
      "name": "submit",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "payable",
      "type": "function"
    }
  ],
  functions: [
    {
      name: 'submit',
      description: '质押 ETH 获得 stETH',
      inputs: [
        { name: '_referral', type: 'address', description: '推荐人地址 (可为零地址)', required: false }
      ],
      gasEstimate: 100000,
      riskLevel: 'low'
    }
  ],
  website: 'https://lido.fi',
  documentation: 'https://docs.lido.fi'
};

// 1inch Router 模板
export const ONEINCH_TEMPLATE: DefiTemplate = {
  id: '1inch-v5',
  name: '1inch V5',
  description: 'DEX 聚合器',
  protocol: '1inch',
  category: 'dex',
  contractAddress: {
    mainnet: '0x1111111254EEB25477B68fb85Ed929f73A960582',
    polygon: '0x1111111254EEB25477B68fb85Ed929f73A960582',
    arbitrum: '0x1111111254EEB25477B68fb85Ed929f73A960582'
  },
  abi: [
    {
      "inputs": [
        { "internalType": "address", "name": "executor", "type": "address" },
        {
          "components": [
            { "internalType": "contract IERC20", "name": "srcToken", "type": "address" },
            { "internalType": "contract IERC20", "name": "dstToken", "type": "address" },
            { "internalType": "address payable", "name": "srcReceiver", "type": "address" },
            { "internalType": "address payable", "name": "dstReceiver", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "uint256", "name": "minReturnAmount", "type": "uint256" },
            { "internalType": "uint256", "name": "flags", "type": "uint256" }
          ],
          "internalType": "struct GenericRouter.SwapDescription",
          "name": "desc",
          "type": "tuple"
        },
        { "internalType": "bytes", "name": "permit", "type": "bytes" },
        { "internalType": "bytes", "name": "data", "type": "bytes" }
      ],
      "name": "swap",
      "outputs": [
        { "internalType": "uint256", "name": "returnAmount", "type": "uint256" },
        { "internalType": "uint256", "name": "spentAmount", "type": "uint256" }
      ],
      "stateMutability": "payable",
      "type": "function"
    }
  ],
  functions: [
    {
      name: 'swap',
      description: '通过最优路径进行代币交换',
      inputs: [
        { name: 'executor', type: 'address', description: '执行器地址', required: true },
        { name: 'srcToken', type: 'address', description: '源代币地址', required: true },
        { name: 'dstToken', type: 'address', description: '目标代币地址', required: true },
        { name: 'srcReceiver', type: 'address', description: '源代币接收者', required: true },
        { name: 'dstReceiver', type: 'address', description: '目标代币接收者', required: true },
        { name: 'amount', type: 'uint256', description: '交换数量', required: true },
        { name: 'minReturnAmount', type: 'uint256', description: '最小返回数量', required: true },
        { name: 'flags', type: 'uint256', description: '标志位', required: true },
        { name: 'permit', type: 'bytes', description: '许可数据', required: false },
        { name: 'data', type: 'bytes', description: '交换数据', required: true }
      ],
      gasEstimate: 200000,
      riskLevel: 'medium'
    }
  ],
  website: 'https://1inch.io',
  documentation: 'https://docs.1inch.io'
};

// 所有模板的集合
export const DEFI_TEMPLATES: DefiTemplate[] = [
  UNISWAP_V3_TEMPLATE,
  AAVE_V3_TEMPLATE,
  COMPOUND_V3_TEMPLATE,
  LIDO_TEMPLATE,
  ONEINCH_TEMPLATE
];

// 根据类别获取模板
export const getTemplatesByCategory = (category: DefiTemplate['category']): DefiTemplate[] => {
  return DEFI_TEMPLATES.filter(template => template.category === category);
};

// 根据协议获取模板
export const getTemplatesByProtocol = (protocol: string): DefiTemplate[] => {
  return DEFI_TEMPLATES.filter(template => 
    template.protocol.toLowerCase().includes(protocol.toLowerCase())
  );
};

// 根据 ID 获取模板
export const getTemplateById = (id: string): DefiTemplate | undefined => {
  return DEFI_TEMPLATES.find(template => template.id === id);
};

// 获取模板的合约地址（根据网络）
export const getTemplateAddress = (template: DefiTemplate, network: keyof DefiTemplate['contractAddress']): string | undefined => {
  return template.contractAddress[network];
};

// 验证模板参数
export const validateTemplateParams = (template: DefiTemplate, functionName: string, params: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} => {
  const func = template.functions.find(f => f.name === functionName);
  if (!func) {
    return { isValid: false, errors: [`Function ${functionName} not found in template`] };
  }

  const errors: string[] = [];
  
  for (const input of func.inputs) {
    if (input.required && !params[input.name]) {
      errors.push(`Required parameter ${input.name} is missing`);
    }
    
    if (params[input.name] && input.type === 'address' && !params[input.name].match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push(`Parameter ${input.name} is not a valid address`);
    }
  }

  return { isValid: errors.length === 0, errors };
};

// 生成模板的默认参数
export const generateDefaultParams = (template: DefiTemplate, functionName: string, userAddress?: string): Record<string, any> => {
  const func = template.functions.find(f => f.name === functionName);
  if (!func) return {};

  const params: Record<string, any> = {};
  
  for (const input of func.inputs) {
    switch (input.name) {
      case 'recipient':
      case 'to':
      case 'onBehalfOf':
      case 'dstReceiver':
      case 'srcReceiver':
        params[input.name] = userAddress || '';
        break;
      case 'deadline':
        params[input.name] = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
        break;
      case 'referralCode':
        params[input.name] = '0';
        break;
      case 'fee':
        if (template.id === 'uniswap-v3') {
          params[input.name] = '3000'; // 0.3% fee tier
        }
        break;
      case 'interestRateMode':
        params[input.name] = '2'; // Variable rate
        break;
      case 'sqrtPriceLimitX96':
        params[input.name] = '0'; // No price limit
        break;
      case '_referral':
        params[input.name] = '0x0000000000000000000000000000000000000000';
        break;
      default:
        params[input.name] = '';
    }
  }

  return params;
};