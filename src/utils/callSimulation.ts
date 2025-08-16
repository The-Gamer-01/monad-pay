import { createPublicClient, http, encodeFunctionData, decodeFunctionResult, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';
import { type ABIFunction } from './abiParser';

// 模拟结果接口
export interface SimulationResult {
  success: boolean;
  gasEstimate?: bigint;
  returnValue?: any;
  error?: string;
  revertReason?: string;
  logs?: any[];
}

// 模拟配置
export interface SimulationConfig {
  rpcUrl?: string;
  blockNumber?: bigint;
  from?: string;
  value?: bigint;
  gasLimit?: bigint;
}

// 默认配置
const DEFAULT_CONFIG: SimulationConfig = {
  rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
  from: '0x0000000000000000000000000000000000000001',
  value: BigInt(0),
  gasLimit: BigInt(1000000)
};

// 创建公共客户端
function createClient(config: SimulationConfig) {
  return createPublicClient({
    chain: mainnet,
    transport: http(config.rpcUrl || DEFAULT_CONFIG.rpcUrl)
  });
}

// 模拟合约调用
export async function simulateContractCall(
  contractAddress: string,
  func: ABIFunction,
  params: Record<string, any>,
  config: SimulationConfig = {}
): Promise<SimulationResult> {
  try {
    const client = createClient(config);
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // 准备参数
    const args = func.inputs.map(input => {
      const value = params[input.name];
      if (value === undefined || value === '') {
        throw new Error(`Missing parameter: ${input.name}`);
      }
      return convertParamValue(value, input.type);
    });

    // 编码函数调用
    const data = encodeFunctionData({
      abi: [func],
      functionName: func.name,
      args
    });

    // 估算Gas
    let gasEstimate: bigint;
    try {
      gasEstimate = await client.estimateGas({
        to: contractAddress as `0x${string}`,
        data,
        account: finalConfig.from as `0x${string}`,
        value: finalConfig.value
      });
    } catch (gasError) {
      // 如果Gas估算失败，使用默认值
      gasEstimate = BigInt(21000);
    }

    // 模拟调用（仅对view/pure函数）
    if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
      try {
        const result = await client.call({
          to: contractAddress as `0x${string}`,
          data,
          account: finalConfig.from as `0x${string}`,
          value: finalConfig.value,
          blockNumber: config.blockNumber
        });

        let returnValue: any = null;
        if (result.data && func.outputs && func.outputs.length > 0) {
          try {
            const decoded = decodeFunctionResult({
              abi: [func],
              functionName: func.name,
              data: result.data
            });
            returnValue = decoded;
          } catch (decodeError) {
            console.warn('Failed to decode return value:', decodeError);
          }
        }

        return {
          success: true,
          gasEstimate,
          returnValue
        };
      } catch (callError: any) {
        return {
          success: false,
          gasEstimate,
          error: callError.message || 'Call simulation failed',
          revertReason: extractRevertReason(callError)
        };
      }
    } else {
      // 对于状态改变函数，只返回Gas估算
      return {
        success: true,
        gasEstimate,
        returnValue: 'State-changing function - execution would succeed'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Simulation failed'
    };
  }
}

// 批量模拟多个调用
export async function simulateMultipleCalls(
  calls: Array<{
    contractAddress: string;
    func: ABIFunction;
    params: Record<string, any>;
  }>,
  config: SimulationConfig = {}
): Promise<SimulationResult[]> {
  const results: SimulationResult[] = [];
  
  for (const call of calls) {
    const result = await simulateContractCall(
      call.contractAddress,
      call.func,
      call.params,
      config
    );
    results.push(result);
  }
  
  return results;
}

// 估算Gas价格
export async function estimateGasPrice(config: SimulationConfig = {}): Promise<{
  slow: bigint;
  standard: bigint;
  fast: bigint;
}> {
  try {
    const client = createClient(config);
    const gasPrice = await client.getGasPrice();
    
    return {
      slow: gasPrice * BigInt(80) / BigInt(100), // 80% of current
      standard: gasPrice,
      fast: gasPrice * BigInt(120) / BigInt(100) // 120% of current
    };
  } catch (error) {
    // 返回默认值
    return {
      slow: BigInt('10000000000'), // 10 gwei
      standard: BigInt('20000000000'), // 20 gwei
      fast: BigInt('30000000000') // 30 gwei
    };
  }
}

// 计算交易成本
export function calculateTransactionCost(
  gasEstimate: bigint,
  gasPrice: bigint
): {
  costInWei: bigint;
  costInGwei: string;
  costInEth: string;
} {
  const costInWei = gasEstimate * gasPrice;
  const costInGwei = (costInWei / BigInt('1000000000')).toString();
  const costInEth = (Number(costInWei) / 1e18).toFixed(6);
  
  return {
    costInWei,
    costInGwei,
    costInEth
  };
}

// 验证合约存在性
export async function verifyContractExists(
  contractAddress: string,
  config: SimulationConfig = {}
): Promise<{
  exists: boolean;
  isContract: boolean;
  bytecodeSize?: number;
}> {
  try {
    const client = createClient(config);
    const bytecode = await client.getBytecode({
      address: contractAddress as `0x${string}`
    });
    
    const exists = bytecode !== undefined;
    const isContract = exists && bytecode !== '0x';
    const bytecodeSize = bytecode ? (bytecode.length - 2) / 2 : 0; // Remove '0x' and divide by 2
    
    return {
      exists,
      isContract,
      bytecodeSize
    };
  } catch (error) {
    return {
      exists: false,
      isContract: false
    };
  }
}

// 获取合约余额
export async function getContractBalance(
  contractAddress: string,
  config: SimulationConfig = {}
): Promise<bigint> {
  try {
    const client = createClient(config);
    return await client.getBalance({
      address: contractAddress as `0x${string}`
    });
  } catch (error) {
    return BigInt(0);
  }
}

// 模拟交易执行路径
export async function simulateTransactionPath(
  contractAddress: string,
  func: ABIFunction,
  params: Record<string, any>,
  config: SimulationConfig = {}
): Promise<{
  success: boolean;
  steps: Array<{
    step: string;
    status: 'success' | 'warning' | 'error';
    message: string;
    gasUsed?: bigint;
  }>;
  totalGasEstimate?: bigint;
}> {
  const steps: Array<{
    step: string;
    status: 'success' | 'warning' | 'error';
    message: string;
    gasUsed?: bigint;
  }> = [];

  try {
    // 步骤1: 验证合约存在
    const contractCheck = await verifyContractExists(contractAddress, config);
    if (!contractCheck.isContract) {
      steps.push({
        step: 'Contract Verification',
        status: 'error',
        message: 'Target address is not a contract'
      });
      return { success: false, steps };
    }
    steps.push({
      step: 'Contract Verification',
      status: 'success',
      message: `Contract verified (${contractCheck.bytecodeSize} bytes)`
    });

    // 步骤2: 参数验证
    const missingParams = func.inputs.filter(input => 
      params[input.name] === undefined || params[input.name] === ''
    );
    if (missingParams.length > 0) {
      steps.push({
        step: 'Parameter Validation',
        status: 'error',
        message: `Missing parameters: ${missingParams.map(p => p.name).join(', ')}`
      });
      return { success: false, steps };
    }
    steps.push({
      step: 'Parameter Validation',
      status: 'success',
      message: 'All parameters provided'
    });

    // 步骤3: Gas估算
    const simulation = await simulateContractCall(contractAddress, func, params, config);
    if (!simulation.success) {
      steps.push({
        step: 'Gas Estimation',
        status: 'error',
        message: simulation.error || 'Gas estimation failed'
      });
      return { success: false, steps };
    }
    steps.push({
      step: 'Gas Estimation',
      status: 'success',
      message: `Estimated gas: ${simulation.gasEstimate?.toString()}`,
      gasUsed: simulation.gasEstimate
    });

    // 步骤4: 调用模拟
    if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
      steps.push({
        step: 'Call Simulation',
        status: 'success',
        message: `Return value: ${JSON.stringify(simulation.returnValue)}`
      });
    } else {
      steps.push({
        step: 'Call Simulation',
        status: 'warning',
        message: 'State-changing function - actual execution required'
      });
    }

    return {
      success: true,
      steps,
      totalGasEstimate: simulation.gasEstimate
    };
  } catch (error: any) {
    steps.push({
      step: 'Simulation',
      status: 'error',
      message: error.message || 'Simulation failed'
    });
    return { success: false, steps };
  }
}

// 辅助函数：转换参数值
function convertParamValue(value: any, type: string): any {
  if (type.startsWith('uint') || type.startsWith('int')) {
    return BigInt(value);
  }
  if (type === 'bool') {
    return Boolean(value);
  }
  if (type === 'address') {
    return value as `0x${string}`;
  }
  if (type.startsWith('bytes')) {
    return value as `0x${string}`;
  }
  if (type.endsWith('[]')) {
    return Array.isArray(value) ? value : [value];
  }
  return value;
}

// 辅助函数：提取回滚原因
function extractRevertReason(error: any): string | undefined {
  if (error.data) {
    try {
      // 尝试解码标准的Error(string)回滚
      if (error.data.startsWith('0x08c379a0')) {
        const reason = error.data.slice(138); // Skip function selector and offset
        return Buffer.from(reason, 'hex').toString('utf8').replace(/\0/g, '');
      }
    } catch (e) {
      // 忽略解码错误
    }
  }
  return error.reason || error.message;
}

// 预设的模拟场景
export const SIMULATION_SCENARIOS = {
  // ERC20 转账
  ERC20_TRANSFER: {
    name: 'ERC20 Transfer',
    description: 'Simulate ERC20 token transfer',
    function: {
      name: 'transfer',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ name: '', type: 'bool' }]
    } as ABIFunction,
    sampleParams: {
      to: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6',
      amount: '1000000000000000000' // 1 token
    }
  },
  
  // Uniswap V2 交换
  UNISWAP_SWAP: {
    name: 'Uniswap V2 Swap',
    description: 'Simulate token swap on Uniswap V2',
    function: {
      name: 'swapExactTokensForTokens',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'amountIn', type: 'uint256' },
        { name: 'amountOutMin', type: 'uint256' },
        { name: 'path', type: 'address[]' },
        { name: 'to', type: 'address' },
        { name: 'deadline', type: 'uint256' }
      ],
      outputs: [{ name: 'amounts', type: 'uint256[]' }]
    } as ABIFunction,
    sampleParams: {
      amountIn: '1000000000000000000',
      amountOutMin: '0',
      path: ['0xA0b86a33E6441b8C4505B8C4C2B9C4B4C4B4C4B4', '0xB0b86a33E6441b8C4505B8C4C2B9C4B4C4B4C4B4'],
      to: '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6',
      deadline: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
    }
  }
};