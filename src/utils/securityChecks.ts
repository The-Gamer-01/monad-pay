import { isAddress } from 'viem';
import { type ABIFunction } from './abiParser';

// 安全配置
export interface SecurityConfig {
  maxGasLimit: bigint;
  allowedContracts: Set<string>;
  blockedContracts: Set<string>;
  maxValuePerTransaction: bigint;
  requireWhitelist: boolean;
  enableReentrancyProtection: boolean;
}

// 默认安全配置
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxGasLimit: BigInt(500000), // 500k gas limit
  allowedContracts: new Set<string>(),
  blockedContracts: new Set<string>(),
  maxValuePerTransaction: BigInt('1000000000000000000'), // 1 ETH
  requireWhitelist: false,
  enableReentrancyProtection: true
};

// 危险函数模式
const DANGEROUS_FUNCTION_PATTERNS = [
  /^selfdestruct$/i,
  /^suicide$/i,
  /^delegatecall$/i,
  /^callcode$/i,
  /^create2?$/i,
  /.*withdraw.*all.*/i,
  /.*drain.*/i,
  /.*emergency.*/i
];

// 高风险参数类型
const HIGH_RISK_PARAM_TYPES = [
  'bytes',
  'bytes32',
  'address[]',
  'uint256[]'
];

// 安全检查结果
export interface SecurityCheckResult {
  isSecure: boolean;
  warnings: string[];
  errors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// 合约地址安全检查
export function checkContractAddress(
  contractAddress: string,
  config: SecurityConfig
): SecurityCheckResult {
  const result: SecurityCheckResult = {
    isSecure: true,
    warnings: [],
    errors: [],
    riskLevel: 'low'
  };

  // 验证地址格式
  if (!isAddress(contractAddress)) {
    result.isSecure = false;
    result.errors.push('Invalid contract address format');
    result.riskLevel = 'critical';
    return result;
  }

  // 检查黑名单
  if (config.blockedContracts.has(contractAddress.toLowerCase())) {
    result.isSecure = false;
    result.errors.push('Contract is in blocklist');
    result.riskLevel = 'critical';
    return result;
  }

  // 检查白名单（如果启用）
  if (config.requireWhitelist && !config.allowedContracts.has(contractAddress.toLowerCase())) {
    result.isSecure = false;
    result.errors.push('Contract is not whitelisted');
    result.riskLevel = 'high';
    return result;
  }

  // 检查是否为已知的高风险地址
  if (isHighRiskAddress(contractAddress)) {
    result.warnings.push('Contract address appears to be high risk');
    result.riskLevel = 'high';
  }

  return result;
}

// 函数安全检查
export function checkFunctionSecurity(
  func: ABIFunction,
  params: Record<string, any>,
  config: SecurityConfig
): SecurityCheckResult {
  const result: SecurityCheckResult = {
    isSecure: true,
    warnings: [],
    errors: [],
    riskLevel: 'low'
  };

  // 检查危险函数名
  const isDangerous = DANGEROUS_FUNCTION_PATTERNS.some(pattern => 
    pattern.test(func.name)
  );
  
  if (isDangerous) {
    result.warnings.push(`Function '${func.name}' may be dangerous`);
    result.riskLevel = 'high';
  }

  // 检查函数状态可变性
  if (func.stateMutability === 'payable') {
    result.warnings.push('Function can receive Ether');
    if (result.riskLevel === 'low') result.riskLevel = 'medium';
  }

  // 检查参数类型风险
  for (const input of func.inputs) {
    if (HIGH_RISK_PARAM_TYPES.some(type => input.type.includes(type))) {
      result.warnings.push(`Parameter '${input.name}' has high-risk type '${input.type}'`);
      if (result.riskLevel === 'low') result.riskLevel = 'medium';
    }

    // 检查地址参数
    if (input.type === 'address' && params[input.name]) {
      const addressValue = params[input.name];
      if (!isAddress(addressValue)) {
        result.errors.push(`Invalid address for parameter '${input.name}'`);
        result.isSecure = false;
        result.riskLevel = 'high';
      }
    }

    // 检查数组长度
    if (input.type.includes('[]') && params[input.name]) {
      const arrayValue = params[input.name];
      if (Array.isArray(arrayValue) && arrayValue.length > 100) {
        result.warnings.push(`Large array parameter '${input.name}' may cause high gas usage`);
        if (result.riskLevel === 'low') result.riskLevel = 'medium';
      }
    }
  }

  return result;
}

// Gas 限制检查
export function checkGasLimit(
  estimatedGas: bigint,
  config: SecurityConfig
): SecurityCheckResult {
  const result: SecurityCheckResult = {
    isSecure: true,
    warnings: [],
    errors: [],
    riskLevel: 'low'
  };

  if (estimatedGas > config.maxGasLimit) {
    result.isSecure = false;
    result.errors.push(`Gas limit exceeded: ${estimatedGas} > ${config.maxGasLimit}`);
    result.riskLevel = 'high';
  } else if (estimatedGas > config.maxGasLimit / BigInt(2)) {
    result.warnings.push('High gas usage detected');
    result.riskLevel = 'medium';
  }

  return result;
}

// 交易价值检查
export function checkTransactionValue(
  value: bigint,
  config: SecurityConfig
): SecurityCheckResult {
  const result: SecurityCheckResult = {
    isSecure: true,
    warnings: [],
    errors: [],
    riskLevel: 'low'
  };

  if (value > config.maxValuePerTransaction) {
    result.isSecure = false;
    result.errors.push(`Transaction value exceeds limit: ${value} > ${config.maxValuePerTransaction}`);
    result.riskLevel = 'critical';
  } else if (value > config.maxValuePerTransaction / BigInt(2)) {
    result.warnings.push('High transaction value detected');
    result.riskLevel = 'medium';
  }

  return result;
}

// 重入攻击保护检查
export function checkReentrancyRisk(
  func: ABIFunction,
  targetContract: string
): SecurityCheckResult {
  const result: SecurityCheckResult = {
    isSecure: true,
    warnings: [],
    errors: [],
    riskLevel: 'low'
  };

  // 检查是否为状态改变函数
  const isStateChanging = func.stateMutability === 'nonpayable' || func.stateMutability === 'payable';
  
  if (isStateChanging) {
    // 检查是否有外部调用风险
    const hasExternalCallRisk = func.inputs.some(input => 
      input.type === 'address' || input.type === 'bytes'
    );
    
    if (hasExternalCallRisk) {
      result.warnings.push('Function may be vulnerable to reentrancy attacks');
      result.riskLevel = 'medium';
    }
  }

  return result;
}

// 综合安全检查
export function performComprehensiveSecurityCheck(
  contractAddress: string,
  func: ABIFunction,
  params: Record<string, any>,
  value: bigint,
  estimatedGas: bigint,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): SecurityCheckResult {
  const checks = [
    checkContractAddress(contractAddress, config),
    checkFunctionSecurity(func, params, config),
    checkGasLimit(estimatedGas, config),
    checkTransactionValue(value, config)
  ];

  if (config.enableReentrancyProtection) {
    checks.push(checkReentrancyRisk(func, contractAddress));
  }

  // 合并所有检查结果
  const combinedResult: SecurityCheckResult = {
    isSecure: true,
    warnings: [],
    errors: [],
    riskLevel: 'low'
  };

  for (const check of checks) {
    if (!check.isSecure) {
      combinedResult.isSecure = false;
    }
    combinedResult.warnings.push(...check.warnings);
    combinedResult.errors.push(...check.errors);
    
    // 取最高风险级别
    if (getRiskLevelValue(check.riskLevel) > getRiskLevelValue(combinedResult.riskLevel)) {
      combinedResult.riskLevel = check.riskLevel;
    }
  }

  return combinedResult;
}

// 辅助函数：检查是否为高风险地址
function isHighRiskAddress(address: string): boolean {
  // 这里可以添加已知的高风险地址列表
  const knownHighRiskAddresses = new Set<string>([
    // 添加已知的恶意合约地址
  ]);
  
  return knownHighRiskAddresses.has(address.toLowerCase());
}

// 辅助函数：获取风险级别数值
function getRiskLevelValue(level: 'low' | 'medium' | 'high' | 'critical'): number {
  switch (level) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    case 'critical': return 4;
    default: return 1;
  }
}

// 安全配置管理
export class SecurityConfigManager {
  private config: SecurityConfig;

  constructor(initialConfig: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...initialConfig };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  addToWhitelist(address: string): void {
    if (isAddress(address)) {
      this.config.allowedContracts.add(address.toLowerCase());
    }
  }

  removeFromWhitelist(address: string): void {
    this.config.allowedContracts.delete(address.toLowerCase());
  }

  addToBlocklist(address: string): void {
    if (isAddress(address)) {
      this.config.blockedContracts.add(address.toLowerCase());
    }
  }

  removeFromBlocklist(address: string): void {
    this.config.blockedContracts.delete(address.toLowerCase());
  }

  isWhitelisted(address: string): boolean {
    return this.config.allowedContracts.has(address.toLowerCase());
  }

  isBlocked(address: string): boolean {
    return this.config.blockedContracts.has(address.toLowerCase());
  }
}

// 导出默认安全配置管理器实例
export const defaultSecurityManager = new SecurityConfigManager();