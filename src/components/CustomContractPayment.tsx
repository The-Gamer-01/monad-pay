import React, { useState, useEffect } from 'react';
import { 
  parseContractABI, 
  validateABI, 
  fetchContractABI, 
  encodeFunctionCall,
  validateFunctionParams,
  DEFI_ABI_TEMPLATES,
  type ABIFunction 
} from '../utils/abiParser';
import {
  performComprehensiveSecurityCheck,
  defaultSecurityManager,
  type SecurityCheckResult
} from '../utils/securityChecks';
import {
  simulateContractCall,
  simulateTransactionPath,
  estimateGasPrice,
  calculateTransactionCost,
  type SimulationResult
} from '../utils/callSimulation';
import {
  verifyContractWithCache,
  type ContractVerificationResult,
  type ContractInfo,
  getContractInfo
} from '../utils/contractVerification';
import { contractAnalytics } from '../utils/analyticsExtension';
import {
  DEFI_TEMPLATES as IMPORTED_DEFI_TEMPLATES,
  getTemplatesByCategory,
  getTemplateById,
  getTemplateAddress,
  validateTemplateParams,
  generateDefaultParams,
  type DefiTemplate
} from '../utils/defiTemplates';
import { useAccount } from 'wagmi';

interface CustomContractPaymentProps {
  onPaymentCreate?: (paymentData: any) => void;
}

// UI Components
interface BaseProps {
  children: React.ReactNode;
  className?: string;
}

interface CardProps extends BaseProps {
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`} onClick={onClick}>
    {children}
  </div>
);

const CardHeader: React.FC<BaseProps> = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<BaseProps> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<BaseProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline';
  size?: 'default' | 'lg' | 'icon';
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className = '', disabled = false, variant = 'default', size = 'default' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  };
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

interface InputProps {
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const Input: React.FC<InputProps> = ({ id, type = 'text', placeholder, value, onChange, className = '' }) => (
  <input
    id={id}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
  />
);

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

const Label: React.FC<LabelProps> = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
  </label>
);

interface TextareaProps {
  id?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  className?: string;
}

const Textarea: React.FC<TextareaProps> = ({ id, placeholder, value, onChange, rows = 3, className = '' }) => (
  <textarea
    id={id}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${className}`}
  />
);

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ children, value, onValueChange, className = '' }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    >
      {children}
    </select>
  );
};

const SelectTrigger: React.FC<BaseProps> = ({ children }) => <>{children}</>;
const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => <option value="" disabled>{placeholder}</option>;
const SelectContent: React.FC<BaseProps> = ({ children }) => <>{children}</>;
const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => (
  <option value={value}>{children}</option>
);

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    outline: 'border border-gray-300 text-gray-700',
    secondary: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface AlertProps {
  children: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ children, className = '' }) => (
  <div className={`p-4 rounded-md border border-yellow-200 bg-yellow-50 ${className}`}>
    {children}
  </div>
);

const AlertDescription: React.FC<BaseProps> = ({ children }) => (
  <div className="text-sm text-yellow-800">
    {children}
  </div>
);

interface TabsProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ children, value, onValueChange, className = '' }) => (
  <div className={className}>
    {React.Children.map(children, child => 
      React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { activeTab: value, onTabChange: onValueChange }) : child
    )}
  </div>
);

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => (
  <div className={`flex space-x-1 rounded-lg bg-gray-100 p-1 ${className}`}>
    {children}
  </div>
);

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = '', activeTab, onTabChange }) => (
  <button
    onClick={() => onTabChange?.(value)}
    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      activeTab === value 
        ? 'bg-white text-gray-900 shadow-sm' 
        : 'text-gray-600 hover:text-gray-900'
    } ${className}`}
  >
    {children}
  </button>
);

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
}

const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '', activeTab }) => {
  return activeTab === value ? <div className={className}>{children}</div> : null;
};

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked = false, onCheckedChange, className = '' }) => (
  <button
    onClick={() => onCheckedChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    } ${className}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

interface SeparatorProps {
  className?: string;
}

const Separator: React.FC<SeparatorProps> = ({ className = '' }) => (
  <hr className={`border-gray-200 ${className}`} />
);

// Icons
const Code = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const FileText = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Settings = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Shield = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Zap = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const AlertTriangle = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckCircle = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExternalLink = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const Upload = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const Play = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Activity = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CustomContractPayment: React.FC<CustomContractPaymentProps> = ({ onPaymentCreate }) => {
  const { address } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [abi, setAbi] = useState('');
  const [parsedABI, setParsedABI] = useState<ABIFunction[]>([]);
  const [abiError, setAbiError] = useState<string>('');
  const [securityCheck, setSecurityCheck] = useState<SecurityCheckResult | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [transactionPath, setTransactionPath] = useState<any>(null);
  const [gasPrice, setGasPrice] = useState<{ slow: bigint; standard: bigint; fast: bigint } | null>(null);
  const [verificationResult, setVerificationResult] = useState<ContractVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DefiTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<ABIFunction | null>(null);
  const [functionParams, setFunctionParams] = useState<Record<string, any>>({});
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('ETH');
  const [gasLimit, setGasLimit] = useState('300000');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [requiresReturn, setRequiresReturn] = useState(false);
  const [expectedReturn, setExpectedReturn] = useState('');
  const [isContractVerified, setIsContractVerified] = useState(false);
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('contract');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 解析 ABI
  const parseABI = (abiString: string) => {
    try {
      setAbiError('');
      const validation = validateABI(abiString);
      if (!validation.isValid) {
        setAbiError(validation.error || 'ABI格式无效');
        setParsedABI([]);
        return;
      }
      
      const parsed = parseContractABI(abiString);
      setParsedABI(parsed.functions);
      setErrors(prev => ({ ...prev, abi: '' }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ABI解析失败';
      setAbiError(errorMessage);
      setParsedABI([]);
    }
  };

  // 验证合约地址
  const verifyContract = async (address: string) => {
    try {
      if (!address || address.length !== 42 || !address.startsWith('0x')) {
        setErrors(prev => ({ ...prev, contract: 'Invalid contract address' }));
        return;
      }
      
      setIsVerifying(true);
      const [verification, info] = await Promise.all([
        verifyContractWithCache(address as `0x${string}`, 1), // 假设使用以太坊主网
        getContractInfo(address as `0x${string}`)
      ]);
      
      setVerificationResult(verification);
      setContractInfo(info);
      setIsContractVerified(verification.isVerified);
      setErrors(prev => ({ ...prev, contract: '' }));
    } catch (error) {
      console.error('Contract verification failed:', error);
      setVerificationResult({
        isVerified: false,
        securityScore: 0,
        riskLevel: 'high',
        warnings: ['验证失败']
      });
      setErrors(prev => ({ ...prev, contract: 'Contract verification failed' }));
      setIsContractVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // 应用模板
  const applyTemplate = (template: DefiTemplate) => {
    const network = 'mainnet'; // 默认使用主网
    const address = getTemplateAddress(template, network);
    
    if (address) {
      setContractAddress(address);
      setAbi(JSON.stringify(template.abi, null, 2));
      setSelectedTemplate(template);
      setShowTemplates(false);
      
      // 解析 ABI
      try {
        const parsed = parseContractABI(template.abi);
        setParsedABI(parsed.functions);
        
        // 如果只有一个函数，自动选择
        if (parsed.functions.length === 1) {
          setSelectedFunction(parsed.functions[0]);
          const defaultParams = generateDefaultParams(template, parsed.functions[0].name, address);
          setFunctionParams(defaultParams);
        }
      } catch (error) {
        console.error('Failed to parse template ABI:', error);
      }
      
      // 自动验证合约
      verifyContract(address);
    }
  };

  // 清除模板
  const clearTemplate = () => {
    setSelectedTemplate(null);
    setContractAddress('');
    setAbi('');
    setParsedABI([]);
    setSelectedFunction(null);
    setFunctionParams({});
    setVerificationResult(null);
    setContractInfo(null);
  };

  // 执行安全检查
  const performSecurityCheck = () => {
    if (!selectedFunction || !contractAddress) {
      setSecurityCheck(null);
      return;
    }

    try {
      const value = BigInt(amount || '0');
      const estimatedGas = BigInt(21000); // 基础估算
      
      const result = performComprehensiveSecurityCheck(
        contractAddress,
        selectedFunction,
        functionParams,
        value,
        estimatedGas,
        defaultSecurityManager.getConfig()
      );
      
      setSecurityCheck(result);
    } catch (error) {
      console.error('Security check failed:', error);
      setSecurityCheck({
        isSecure: false,
        warnings: [],
        errors: ['Security check failed'],
        riskLevel: 'high'
      });
    }
  };

  // 获取Gas价格
  const fetchGasPrice = async () => {
    try {
      const prices = await estimateGasPrice();
      setGasPrice(prices);
    } catch (error) {
      console.error('Failed to fetch gas prices:', error);
    }
  };

  // 模拟合约调用
  const simulateCall = async () => {
    if (!selectedFunction || !contractAddress) return;
    
    setIsSimulating(true);
    try {
      // 验证参数
      const validation = validateFunctionParams(selectedFunction, functionParams);
      if (!validation.isValid) {
        throw new Error(validation.errors?.join(', ') || 'Parameter validation failed');
      }
      
      // 执行安全检查
      performSecurityCheck();
      
      // 获取Gas价格
      await fetchGasPrice();
      
      // 模拟调用
      const result = await simulateContractCall(
        contractAddress,
        selectedFunction,
        functionParams,
        {
          value: BigInt(amount || '0')
        }
      );
      
      setSimulationResult(result);
      
      // 模拟交易路径
      const pathResult = await simulateTransactionPath(
        contractAddress,
        selectedFunction,
        functionParams,
        {
          value: BigInt(amount || '0')
        }
      );
      
      setTransactionPath(pathResult);
      
    } catch (error) {
      setSimulationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Simulation failed'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // 创建支付
  const createPayment = async () => {
    if (!selectedFunction || !contractAddress || !recipient || !amount) {
      alert('Please fill in all required fields');
      return;
    }

    // 记录交易开始
    const transactionId = contractAnalytics.recordTransaction({
      contractAddress,
      functionName: selectedFunction.name,
      protocol: selectedTemplate?.name,
      category: selectedTemplate?.category,
      value: (selectedFunction?.stateMutability === 'payable' && functionParams.value) ? functionParams.value : '0',
      gasUsed: 0, // 将在交易完成后更新
      gasPrice: '0', // 将在交易完成后更新
      status: 'pending',
      riskLevel: verificationResult?.riskLevel || 'medium',
      securityScore: verificationResult?.securityScore || 50,
      userAddress: address || ''
    });

    try {
      const validation = validateFunctionParams(selectedFunction, functionParams);
      if (!validation.isValid) {
        throw new Error(validation.errors?.join(', ') || 'Parameter validation failed');
      }
      
      const callData = encodeFunctionCall(selectedFunction, functionParams);
      
      const paymentData = {
        type: 'CUSTOM_CONTRACT',
        recipient,
        amount: amount,
        token: token === 'ETH' ? '0x0000000000000000000000000000000000000000' : token,
        targetContract: contractAddress,
        callData,
        expectedReturn: requiresReturn ? expectedReturn : '0x',
        requiresReturn,
        gasLimit: parseInt(gasLimit),
        deadline: Math.floor(new Date(deadline).getTime() / 1000),
        description,
        transactionId // 添加交易ID用于后续跟踪
      };
      
      onPaymentCreate?.(paymentData);
      
      // 更新交易记录为已创建
      contractAnalytics.updateTransaction(transactionId, {
        status: 'success'
      });
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('Failed to create payment');
      
      // 更新交易记录为失败
      contractAnalytics.updateTransaction(transactionId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Failed to create payment'
      });
    }
  };

  // 使用模板
  const useTemplate = (templateKey: string) => {
    const template = getTemplateById(templateKey);
    if (template) {
      applyTemplate(template);
    }
  };

  // 处理合约地址变化
  const handleContractAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setContractAddress(newAddress);
    
    // 如果地址有效，自动验证
    if (newAddress && newAddress.length === 42 && newAddress.startsWith('0x')) {
      verifyContract(newAddress);
    }
  };

  // 处理ABI变化
  const handleAbiChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAbi = e.target.value;
    setAbi(newAbi);
    if (newAbi.trim()) {
      parseABI(newAbi);
    } else {
      setParsedABI([]);
      setAbiError('');
    }
  };

  // 处理函数选择
  const handleFunctionSelect = (functionName: string) => {
    const func = parsedABI.find(f => f.name === functionName);
    if (func) {
      setSelectedFunction(func);
      // 重置参数
      const initialParams: Record<string, any> = {};
      func.inputs.forEach(input => {
        initialParams[input.name] = '';
      });
      setFunctionParams(initialParams);
    }
  };

  // 处理参数变化
  const handleParamChange = (paramName: string, value: string) => {
    setFunctionParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">第三方合约支付</h1>
        <p className="text-gray-600">安全地与任何智能合约交互并创建支付</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contract">合约配置</TabsTrigger>
          <TabsTrigger value="security">安全检查</TabsTrigger>
          <TabsTrigger value="simulation">模拟执行</TabsTrigger>
          <TabsTrigger value="payment">创建支付</TabsTrigger>
        </TabsList>

        <TabsContent value="contract">
          <div className="space-y-6">
            {/* DeFi 模板选择 */}
            <Card>
              <CardHeader>
                <CardTitle>DeFi 协议模板</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">选择常用的 DeFi 协议模板快速开始</p>
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplates(!showTemplates)}
                    >
                      {showTemplates ? '隐藏模板' : '显示模板'}
                    </Button>
                  </div>
                  
                  {showTemplates && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {IMPORTED_DEFI_TEMPLATES.map((template, index) => (
                        <Card key={template.id}>
                          <CardContent>
                            <div className="p-4">
                              <h3 className="font-semibold text-sm mb-2">{template.name}</h3>
                              <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary">{template.category}</Badge>
                                <span className="text-xs text-gray-500">{template.functions.length} 函数</span>
                              </div>
                              <Button
                                   size="default"
                                   onClick={() => applyTemplate(template)}
                                 >
                                   使用
                                 </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {selectedTemplate && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-900">已选择: {selectedTemplate.name}</p>
                        <p className="text-sm text-blue-700">{selectedTemplate.description}</p>
                      </div>
                      <Button variant="outline" onClick={clearTemplate}>
                        清除
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 合约地址输入 */}
            <Card>
              <CardHeader>
                <CardTitle>合约地址</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contract-address">合约地址</Label>
                    <Input
                      id="contract-address"
                      placeholder="0x..."
                      value={contractAddress}
                      onChange={handleContractAddressChange}
                    />
                    {errors.contract && (
                      <p className="text-sm text-red-600 mt-1">{errors.contract}</p>
                    )}
                  </div>
                  
                  {/* 合约验证结果 */}
                  {verificationResult && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        {verificationResult.isVerified ? (
                          <CheckCircle />
                        ) : (
                          <AlertTriangle />
                        )}
                        <span className={`font-medium ${
                          verificationResult.isVerified ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                          {verificationResult.isVerified ? '合约已验证' : '合约未验证'}
                        </span>
                        <Badge variant={verificationResult.riskLevel === 'low' ? 'default' : 
                                     verificationResult.riskLevel === 'medium' ? 'secondary' : 'outline'}>
                          {verificationResult.riskLevel === 'low' ? '低风险' :
                           verificationResult.riskLevel === 'medium' ? '中风险' : '高风险'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">安全评分:</span>
                          <span className="ml-2 font-medium">{verificationResult.securityScore}/100</span>
                        </div>
                        {contractInfo && (
                          <div>
                            <span className="text-gray-600">合约名称:</span>
                            <span className="ml-2 font-medium">{contractInfo.name || '未知'}</span>
                          </div>
                        )}
                      </div>
                      
                      {verificationResult.warnings && verificationResult.warnings.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            <div className="space-y-1">
                              {verificationResult.warnings.map((warning, index) => (
                                <div key={index} className="text-sm">{warning}</div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ABI 输入 */}
            <Card>
              <CardHeader>
                <CardTitle>合约 ABI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="abi">ABI JSON</Label>
                    <Textarea
                      id="abi"
                      placeholder="粘贴合约 ABI JSON..."
                      value={abi}
                      onChange={handleAbiChange}
                      rows={8}
                    />
                    {abiError && (
                      <p className="text-sm text-red-600 mt-1">{abiError}</p>
                    )}
                  </div>
                  
                  {/* 解析的函数列表 */}
                  {parsedABI.length > 0 && (
                    <div>
                      <Label>可调用函数</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {parsedABI.map((func, index) => (
                          <Card
                            key={index}
                            onClick={() => handleFunctionSelect(func.name)}
                          >
                            <CardContent>
                              <div className="p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{func.name}</span>
                                  <div className="flex space-x-1">
                                    {func.stateMutability === 'payable' && <Badge variant="outline">Payable</Badge>}
                                    {func.stateMutability === 'view' && <Badge variant="secondary">View</Badge>}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                  {func.inputs.length} 参数, {func.outputs.length} 返回值
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 函数参数配置 */}
            {selectedFunction && (
              <Card>
                <CardHeader>
                  <CardTitle>函数参数: {selectedFunction.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedFunction.inputs.map((input, index) => (
                      <div key={index}>
                        <Label htmlFor={`param-${input.name}`}>
                          {input.name} ({input.type})
                        </Label>
                        <Input
                          id={`param-${input.name}`}
                          placeholder={`输入 ${input.type} 类型的值`}
                          value={functionParams[input.name] || ''}
                          onChange={(e) => handleParamChange(input.name, e.target.value)}
                        />
                      </div>
                    ))}
                    
                    {selectedFunction.stateMutability === 'payable' && (
                       <div>
                         <Label htmlFor="function-value">发送 ETH 数量 (wei)</Label>
                         <Input
                           id="function-value"
                           placeholder="0"
                           value={functionParams.value || ''}
                           onChange={(e) => handleParamChange('value', e.target.value)}
                         />
                       </div>
                     )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>安全检查</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={performSecurityCheck} disabled={!selectedFunction}>
                  <Shield />
                  执行安全检查
                </Button>
                
                {securityCheck && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {securityCheck.isSecure ? (
                        <CheckCircle />
                      ) : (
                        <AlertTriangle />
                      )}
                      <span className={`font-medium ${
                        securityCheck.isSecure ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {securityCheck.isSecure ? '安全检查通过' : '发现安全风险'}
                      </span>
                      <Badge variant={securityCheck.riskLevel === 'low' ? 'default' : 
                                   securityCheck.riskLevel === 'medium' ? 'secondary' : 'outline'}>
                        {securityCheck.riskLevel === 'low' ? '低风险' :
                         securityCheck.riskLevel === 'medium' ? '中风险' : '高风险'}
                      </Badge>
                    </div>
                    
                    {securityCheck.warnings.length > 0 && (
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-2">警告:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {securityCheck.warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {securityCheck.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-800 mb-2">错误:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {securityCheck.errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation">
          <Card>
            <CardHeader>
              <CardTitle>模拟执行</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={simulateCall} disabled={!selectedFunction || isSimulating}>
                  <Play />
                  {isSimulating ? '模拟中...' : '模拟执行'}
                </Button>
                
                {simulationResult && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {simulationResult.success ? (
                        <CheckCircle />
                      ) : (
                        <AlertTriangle />
                      )}
                      <span className={`font-medium ${
                        simulationResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {simulationResult.success ? '模拟成功' : '模拟失败'}
                      </span>
                    </div>
                    
                    {simulationResult.error && (
                      <Alert>
                        <AlertDescription>
                          <p className="text-sm text-red-700">{simulationResult.error}</p>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {simulationResult.gasEstimate && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">预估 Gas:</span>
                          <span className="ml-2 font-medium">{simulationResult.gasEstimate.toString()}</span>
                        </div>
                        {gasPrice && (
                          <div>
                            <span className="text-gray-600">Gas 价格 (Gwei):</span>
                            <span className="ml-2 font-medium">
                              {(Number(gasPrice.standard) / 1e9).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {simulationResult.returnValue && (
                       <div>
                         <h4 className="font-medium mb-2">返回数据:</h4>
                         <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                           {typeof simulationResult.returnValue === 'object' 
                             ? JSON.stringify(simulationResult.returnValue, null, 2)
                             : simulationResult.returnValue.toString()}
                         </pre>
                       </div>
                     )}
                  </div>
                )}
                
                {transactionPath && (
                  <div>
                    <h4 className="font-medium mb-2">交易路径分析:</h4>
                    <div className="bg-gray-50 p-4 rounded">
                      <pre className="text-xs">{JSON.stringify(transactionPath, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>创建支付</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipient">接收者地址</Label>
                    <Input
                      id="recipient"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">金额</Label>
                    <Input
                      id="amount"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="token">代币</Label>
                    <Select value={token} onValueChange={setToken}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择代币" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ETH">ETH</SelectItem>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="DAI">DAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="gas-limit">Gas 限制</Label>
                    <Input
                      id="gas-limit"
                      placeholder="300000"
                      value={gasLimit}
                      onChange={(e) => setGasLimit(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deadline">截止时间</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    placeholder="支付描述..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={requiresReturn}
                    onCheckedChange={setRequiresReturn}
                  />
                  <Label>需要返回值</Label>
                </div>
                
                {requiresReturn && (
                  <div>
                    <Label htmlFor="expected-return">期望返回值</Label>
                    <Input
                      id="expected-return"
                      placeholder="0x..."
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(e.target.value)}
                    />
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setActiveTab('simulation')}>
                    返回模拟
                  </Button>
                  <Button onClick={createPayment}>
                    创建支付
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomContractPayment;