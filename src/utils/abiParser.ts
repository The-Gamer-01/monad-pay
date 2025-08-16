import { isAddress, encodeFunctionData, decodeFunctionResult as viemDecodeFunctionResult, parseAbi } from 'viem';

export interface ABIFunction {
  name: string;
  type: 'function';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  inputs: ABIInput[];
  outputs: ABIOutput[];
}

export interface ABIInput {
  name: string;
  type: string;
  internalType?: string;
}

export interface ABIOutput {
  name: string;
  type: string;
  internalType?: string;
}

export interface ParsedContract {
  functions: ABIFunction[];
  events: any[];
  errors: any[];
}

/**
 * 解析合约ABI，提取可调用函数
 */
export function parseContractABI(abi: string): ParsedContract {
  try {
    const parsedABI = JSON.parse(abi);
    
    if (!Array.isArray(parsedABI)) {
      throw new Error('ABI必须是一个数组');
    }

    const functions: ABIFunction[] = [];
    const events: any[] = [];
    const errors: any[] = [];

    for (const item of parsedABI) {
      switch (item.type) {
        case 'function':
          if (item.name && item.inputs && item.outputs) {
            functions.push({
              name: item.name,
              type: 'function',
              stateMutability: item.stateMutability || 'nonpayable',
              inputs: item.inputs.map((input: any) => ({
                name: input.name || '',
                type: input.type,
                internalType: input.internalType
              })),
              outputs: item.outputs.map((output: any) => ({
                name: output.name || '',
                type: output.type,
                internalType: output.internalType
              }))
            });
          }
          break;
        case 'event':
          events.push(item);
          break;
        case 'error':
          errors.push(item);
          break;
      }
    }

    return { functions, events, errors };
  } catch (error) {
    throw new Error(`ABI解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 验证ABI格式是否正确
 */
export function validateABI(abi: string): { isValid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(abi);
    
    if (!Array.isArray(parsed)) {
      return { isValid: false, error: 'ABI必须是一个数组' };
    }

    // 检查每个项目是否有必要的字段
    for (const item of parsed) {
      if (!item.type) {
        return { isValid: false, error: '每个ABI项目必须有type字段' };
      }
      
      if (item.type === 'function') {
        if (!item.name) {
          return { isValid: false, error: '函数必须有name字段' };
        }
        if (!Array.isArray(item.inputs)) {
          return { isValid: false, error: '函数必须有inputs数组' };
        }
        if (!Array.isArray(item.outputs)) {
          return { isValid: false, error: '函数必须有outputs数组' };
        }
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'JSON格式无效' };
  }
}

/**
 * 从etherscan等区块链浏览器获取合约ABI
 */
export async function fetchContractABI(contractAddress: string, apiKey?: string): Promise<string> {
  try {
    // 验证地址格式
    if (!isAddress(contractAddress)) {
      throw new Error('无效的合约地址');
    }

    // 这里可以集成多个区块链浏览器API
    // 目前先返回一个示例，实际使用时需要配置API密钥
    const networks = [
      {
        name: 'Ethereum',
        url: `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey || 'YourApiKeyToken'}`,
        chainId: 1
      },
      {
        name: 'Polygon',
        url: `https://api.polygonscan.com/api?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey || 'YourApiKeyToken'}`,
        chainId: 137
      },
      {
        name: 'Arbitrum',
        url: `https://api.arbiscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey || 'YourApiKeyToken'}`,
        chainId: 42161
      }
    ];

    // 尝试从不同网络获取ABI
    for (const network of networks) {
      try {
        const response = await fetch(network.url);
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          return data.result;
        }
      } catch (error) {
        console.warn(`从${network.name}获取ABI失败:`, error);
        continue;
      }
    }

    throw new Error('无法从任何网络获取合约ABI，请手动输入');
  } catch (error) {
    throw new Error(`获取合约ABI失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 生成函数调用的calldata
 */
export function encodeFunctionCall(func: ABIFunction, params: Record<string, any>): string {
  try {
    // 准备参数数组
    const args = func.inputs.map(input => {
      const value = params[input.name];
      if (value === undefined || value === '') {
        throw new Error(`缺少参数: ${input.name}`);
      }
      return value;
    });

    // 使用viem编码函数调用
    return encodeFunctionData({
      abi: [func] as const,
      functionName: func.name,
      args
    });
  } catch (error) {
    throw new Error(`编码函数调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 解码函数调用结果
 */
export function decodeFunctionResult(func: ABIFunction, data: string): any[] {
  try {
    return viemDecodeFunctionResult({
      abi: [func] as const,
      functionName: func.name,
      data: data as `0x${string}`
    }) as any[];
  } catch (error) {
    throw new Error(`解码函数结果失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取函数签名
 */
export function getFunctionSignature(func: ABIFunction): string {
  const inputs = func.inputs.map(input => input.type).join(',');
  return `${func.name}(${inputs})`;
}

/**
 * 验证函数参数
 */
export function validateFunctionParams(func: ABIFunction, params: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const input of func.inputs) {
    const value = params[input.name];
    
    if (value === undefined || value === '') {
      errors.push(`缺少必需参数: ${input.name}`);
      continue;
    }

    // 基本类型验证
    try {
      validateParamType(input.type, value);
    } catch (error) {
      errors.push(`参数 ${input.name} 类型错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 验证参数类型
 */
function validateParamType(type: string, value: any): void {
  if (type.startsWith('uint') || type.startsWith('int')) {
    if (isNaN(Number(value))) {
      throw new Error(`${type} 类型需要数字`);
    }
  } else if (type === 'address') {
    if (!isAddress(value)) {
      throw new Error('无效的地址格式');
    }
  } else if (type === 'bool') {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      throw new Error('布尔类型需要 true 或 false');
    }
  } else if (type.startsWith('bytes')) {
    if (typeof value !== 'string' || !value.startsWith('0x')) {
      throw new Error('字节类型需要十六进制字符串');
    }
  }
}

/**
 * 常用DeFi协议的ABI模板
 */
export const DEFI_ABI_TEMPLATES = {
  erc20: {
    name: 'ERC20 代币',
    abi: JSON.stringify([
      {
        "type": "function",
        "name": "transfer",
        "stateMutability": "nonpayable",
        "inputs": [
          {"name": "to", "type": "address"},
          {"name": "amount", "type": "uint256"}
        ],
        "outputs": [{"name": "", "type": "bool"}]
      },
      {
        "type": "function",
        "name": "approve",
        "stateMutability": "nonpayable",
        "inputs": [
          {"name": "spender", "type": "address"},
          {"name": "amount", "type": "uint256"}
        ],
        "outputs": [{"name": "", "type": "bool"}]
      }
    ], null, 2)
  },
  uniswapV2: {
    name: 'Uniswap V2 Router',
    abi: JSON.stringify([
      {
        "type": "function",
        "name": "swapExactTokensForTokens",
        "stateMutability": "nonpayable",
        "inputs": [
          {"name": "amountIn", "type": "uint256"},
          {"name": "amountOutMin", "type": "uint256"},
          {"name": "path", "type": "address[]"},
          {"name": "to", "type": "address"},
          {"name": "deadline", "type": "uint256"}
        ],
        "outputs": [{"name": "amounts", "type": "uint256[]"}]
      }
    ], null, 2)
  },
  compound: {
    name: 'Compound cToken',
    abi: JSON.stringify([
      {
        "type": "function",
        "name": "mint",
        "stateMutability": "nonpayable",
        "inputs": [{"name": "mintAmount", "type": "uint256"}],
        "outputs": [{"name": "", "type": "uint256"}]
      },
      {
        "type": "function",
        "name": "redeem",
        "stateMutability": "nonpayable",
        "inputs": [{"name": "redeemTokens", "type": "uint256"}],
        "outputs": [{"name": "", "type": "uint256"}]
      }
    ], null, 2)
  }
};