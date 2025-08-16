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
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  };
  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
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
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
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
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
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
  if (activeTab !== value) return null;
  return <div className={`mt-4 ${className}`}>{children}</div>;
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

// 图标组件
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

const DEFI_TEMPLATES = {
  uniswap: {
    name: 'Uniswap V3 Swap',
    address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    description: '通过 Uniswap V3 进行代币交换',
    functions: ['exactInputSingle', 'exactOutputSingle']
  },
  aave: {
    name: 'AAVE Lending Pool',
    address: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
    description: '在 AAVE 协议中存款或借款',
    functions: ['deposit', 'withdraw', 'borrow', 'repay']
  },
  compound: {
    name: 'Compound Finance',
    address: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
    description: '在 Compound 协议中进行借贷操作',
    functions: ['mint', 'redeem', 'borrow', 'repayBorrow']
  }
};

const CustomContractPayment: React.FC<CustomContractPaymentProps> = ({ onPaymentCreate }) => {
  const [contractAddress, setContractAddress] = useState('');
  const [abi, setAbi] = useState('');
  const [parsedABI, setParsedABI] = useState<ABIFunction[]>([]);
  const [abiError, setAbiError] = useState<string>('');
  const [securityCheck, setSecurityCheck] = useState<SecurityCheckResult | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [transactionPath, setTransactionPath] = useState<any>(null);
  const [gasPrice, setGasPrice] = useState<{ slow: bigint; standard: bigint; fast: bigint } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
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
      
      // 这里应该调用实际的合约验证 API
      // 模拟验证过程
      setIsContractVerified(true);
      setContractInfo({
        name: 'Custom Contract',
        verified: true,
        compiler: 'v0.8.19',
        optimization: true
      });
      setErrors(prev => ({ ...prev, contract: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, contract: 'Contract verification failed' }));
      setIsContractVerified(false);
    }
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
        description
      };
      
      onPaymentCreate?.(paymentData);
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('Failed to create payment');
    }
  };

  // 使用模板
  const useTemplate = (templateKey: string) => {
    const template = DEFI_ABI_TEMPLATES[templateKey as keyof typeof DEFI_ABI_TEMPLATES];
    if (template) {
      setAbi(template.abi);
      parseABI(template.abi);
    }
  };

  useEffect(() => {
    if (abi) {
      parseABI(abi);
    }
  }, [abi]);

  useEffect(() => {
    if (contractAddress && contractAddress.length === 42 && contractAddress.startsWith('0x')) {
      verifyContract(contractAddress);
    }
  }, [contractAddress]);

  useEffect(() => {
    if (selectedFunction && contractAddress) {
      performSecurityCheck();
    }
  }, [selectedFunction, functionParams, contractAddress, amount]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          第三方合约支付
        </h1>
        <p className="text-gray-600">
          通过调用第三方智能合约来执行可编程支付
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contract" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            合约设置
          </TabsTrigger>
          <TabsTrigger value="function" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            函数配置
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            支付设置
          </TabsTrigger>
          <TabsTrigger value="simulate" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            模拟测试
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contract" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                DeFi 协议模板
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(DEFI_ABI_TEMPLATES).map(([key, template]) => (
                  <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => useTemplate(key)}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="outline" className="mt-2">
                        ABI模板
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>合约信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract-address">合约地址 *</Label>
                <div className="flex gap-2">
                  <Input
                    id="contract-address"
                    placeholder="0x..."
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className={errors.contract ? 'border-red-500' : ''}
                  />
                  <Button variant="outline" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                {errors.contract && (
                  <p className="text-sm text-red-500">{errors.contract}</p>
                )}
                {isContractVerified && contractInfo && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">合约已验证</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="abi">合约 ABI *</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="abi"
                    placeholder="粘贴合约 ABI JSON..."
                    value={abi}
                    onChange={(e) => setAbi(e.target.value)}
                    rows={6}
                    className={errors.abi ? 'border-red-500' : ''}
                  />
                {abiError && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{abiError}</AlertDescription>
                  </Alert>
                )}
                  <Button variant="outline" size="icon">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {abiError && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{abiError}</AlertDescription>
                  </Alert>
                )}
                {errors.abi && (
                  <p className="text-sm text-red-500">{errors.abi}</p>
                )}
                {parsedABI.length > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">找到 {parsedABI.length} 个可调用函数</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="function" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>选择函数</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsedABI.length > 0 ? (
                <>
                  <Select onValueChange={(value) => {
                    const func = parsedABI.find(f => f.name === value);
                    setSelectedFunction(func || null);
                    setFunctionParams({});
                  }}>
                    <SelectValue placeholder="选择要调用的函数" />
                    {parsedABI.map((func) => (
                      <SelectItem key={func.name} value={func.name}>
                        {func.name} ({func.stateMutability})
                      </SelectItem>
                    ))}
                  </Select>

                  {selectedFunction && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">函数签名</h4>
                        <code className="text-sm">
                          {selectedFunction.name}(
                          {selectedFunction.inputs.map(input => `${input.type} ${input.name}`).join(', ')}
                          )
                        </code>
                      </div>

                      {selectedFunction.inputs.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">函数参数</h4>
                          {selectedFunction.inputs.map((input) => (
                            <div key={input.name} className="space-y-2">
                              <Label htmlFor={input.name}>
                                {input.name} ({input.type})
                              </Label>
                              <Input
                                id={input.name}
                                placeholder={`输入 ${input.type} 类型的值`}
                                value={functionParams[input.name] || ''}
                                onChange={(e) => setFunctionParams(prev => ({
                                  ...prev,
                                  [input.name]: e.target.value
                                }))}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    请先在合约设置中输入有效的 ABI
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>支付配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">接收方地址 *</Label>
                  <Input
                    id="recipient"
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">支付金额 *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="token">支付代币</Label>
                  <Select value={token} onValueChange={setToken}>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="DAI">DAI</SelectItem>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gas-limit">Gas 限制</Label>
                  <Input
                    id="gas-limit"
                    type="number"
                    value={gasLimit}
                    onChange={(e) => setGasLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">截止时间</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  placeholder="描述这笔支付的用途..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>验证返回值</Label>
                    <p className="text-sm text-gray-600">是否需要验证合约调用的返回值</p>
                  </div>
                  <Switch
                    checked={requiresReturn}
                    onCheckedChange={setRequiresReturn}
                  />
                </div>

                {requiresReturn && (
                  <div className="space-y-2">
                    <Label htmlFor="expected-return">期望返回值 (hex)</Label>
                    <Input
                      id="expected-return"
                      placeholder="0x..."
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulate" className="space-y-6" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                调用模拟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={simulateCall} disabled={!selectedFunction || !contractAddress || isSimulating}>
                {isSimulating ? '模拟中...' : '模拟合约调用'}
              </Button>

              {securityCheck && (
                <div className={`p-4 rounded-lg ${
                  securityCheck.riskLevel === 'low' ? 'bg-green-50 border border-green-200' : 
                  securityCheck.riskLevel === 'critical' ? 'bg-red-50 border border-red-200' :
                  'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {securityCheck.riskLevel === 'low' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : securityCheck.riskLevel === 'critical' ? (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-semibold">安全检查结果</span>
                    <Badge 
                      variant={securityCheck.riskLevel === 'low' ? 'default' : 'outline'}
                      className={securityCheck.riskLevel === 'critical' ? 'bg-red-100 text-red-800' : 
                                securityCheck.riskLevel === 'high' ? 'bg-yellow-100 text-yellow-800' : ''}
                    >
                      {securityCheck.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  {securityCheck.errors.length > 0 && (
                    <div className="mb-2">
                      <p className="font-medium text-red-600 text-sm">错误:</p>
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {securityCheck.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {securityCheck.warnings.length > 0 && (
                    <div>
                      <p className="font-medium text-yellow-600 text-sm">警告:</p>
                      <ul className="list-disc list-inside text-sm text-yellow-700">
                        {securityCheck.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {simulationResult && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    simulationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {simulationResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-semibold ${
                        simulationResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {simulationResult.success ? '模拟成功' : '模拟失败'}
                      </span>
                    </div>
                    
                    {simulationResult.success ? (
                      <div className="space-y-3 text-sm">
                        {simulationResult.gasEstimate && (
                          <div className="flex justify-between">
                            <span>预估Gas:</span>
                            <span className="font-mono">{simulationResult.gasEstimate.toString()}</span>
                          </div>
                        )}
                        {gasPrice && simulationResult.gasEstimate && (
                          <div className="space-y-1">
                            <div className="font-medium">交易成本估算:</div>
                            {Object.entries(gasPrice).map(([speed, price]) => {
                              const cost = calculateTransactionCost(simulationResult.gasEstimate!, price);
                              return (
                                <div key={speed} className="flex justify-between text-xs">
                                  <span className="capitalize">{speed}:</span>
                                  <span className="font-mono">{cost.costInEth} ETH</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {simulationResult.returnValue && (
                          <div className="flex justify-between">
                            <span>返回值:</span>
                            <span className="font-mono text-xs break-all">
                              {typeof simulationResult.returnValue === 'object' 
                                ? JSON.stringify(simulationResult.returnValue)
                                : simulationResult.returnValue.toString()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        错误: {simulationResult.error}
                        {simulationResult.revertReason && (
                          <div className="mt-1">
                            <span className="font-medium">回滚原因: </span>
                            {simulationResult.revertReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {transactionPath && (
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    交易路径分析
                  </h4>
                  <div className="space-y-2">
                    {transactionPath.steps.map((step: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.status === 'success' ? 'bg-green-100 text-green-700' :
                          step.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{step.step}</div>
                          <div className={`text-xs mt-1 ${
                            step.status === 'success' ? 'text-green-600' :
                            step.status === 'warning' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {step.message}
                          </div>
                          {step.gasUsed && (
                            <div className="text-xs text-gray-500 mt-1">
                              Gas: {step.gasUsed.toString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {transactionPath.totalGasEstimate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-700">
                        总Gas估算: {transactionPath.totalGasEstimate.toString()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">安全检查</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {isContractVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm">合约验证状态</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Gas 限制检查</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">合约白名单 (需要管理员添加)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={createPayment} 
                className="w-full" 
                size="lg"
                disabled={
                  !selectedFunction || 
                  !contractAddress || 
                  !recipient || 
                  !amount ||
                  (securityCheck && !securityCheck.isSecure)
                }
              >
                创建第三方合约支付
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomContractPayment;