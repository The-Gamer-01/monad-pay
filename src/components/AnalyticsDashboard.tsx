// 分析仪表板组件 - 第三方合约支付统计和监控

import React, { useState, useEffect } from 'react';
import {
  contractAnalytics,
  ContractPaymentStats,
  ProtocolUsage,
  SecurityAlert,
  ContractTransaction,
  formatValue,
  formatGas,
  getRiskColor,
  getStatusColor
} from '../utils/analyticsExtension';

// 基础组件接口
interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

interface CardProps extends BaseProps {
  title?: string;
}

interface ButtonProps extends BaseProps {
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

interface BadgeProps extends BaseProps {
  variant?: 'success' | 'warning' | 'danger' | 'info';
}

interface TabsProps extends BaseProps {
  defaultValue?: string;
}

interface TabsListProps extends BaseProps {}

interface TabsTriggerProps extends BaseProps {
  value: string;
}

interface TabsContentProps extends BaseProps {
  value: string;
}

// 基础 UI 组件
const Card: React.FC<CardProps> = ({ className = '', title, children }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
    {children}
  </div>
);

const Button: React.FC<ButtonProps> = ({ 
  className = '', 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  disabled = false 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Badge: React.FC<BadgeProps> = ({ className = '', children, variant = 'info' }) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Tabs: React.FC<TabsProps> = ({ className = '', children, defaultValue }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || '');
  
  return (
    <div className={`${className}`} data-active-tab={activeTab}>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab })
          : child
      )}
    </div>
  );
};

const TabsList: React.FC<TabsListProps & { activeTab?: string; setActiveTab?: (tab: string) => void }> = ({ 
  className = '', 
  children, 
  activeTab, 
  setActiveTab 
}) => (
  <div className={`flex space-x-1 bg-gray-100 p-1 rounded-lg ${className}`}>
    {React.Children.map(children, child => 
      React.isValidElement(child) 
        ? React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab })
        : child
    )}
  </div>
);

const TabsTrigger: React.FC<TabsTriggerProps & { activeTab?: string; setActiveTab?: (tab: string) => void }> = ({ 
  className = '', 
  children, 
  value, 
  activeTab, 
  setActiveTab 
}) => (
  <button
    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
      activeTab === value 
        ? 'bg-white text-gray-900 shadow-sm' 
        : 'text-gray-600 hover:text-gray-900'
    } ${className}`}
    onClick={() => setActiveTab?.(value)}
  >
    {children}
  </button>
);

const TabsContent: React.FC<TabsContentProps & { activeTab?: string }> = ({ 
  className = '', 
  children, 
  value, 
  activeTab 
}) => {
  if (activeTab !== value) return null;
  return <div className={`mt-4 ${className}`}>{children}</div>;
};

// 统计卡片组件
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}> = ({ title, value, subtitle, trend, className = '' }) => (
  <Card className={className}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className={`text-sm ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </Card>
);

// 协议使用图表组件
const ProtocolChart: React.FC<{ protocols: ProtocolUsage[] }> = ({ protocols }) => {
  const maxTransactions = Math.max(...protocols.map(p => p.transactions));
  
  return (
    <div className="space-y-4">
      {protocols.slice(0, 5).map((protocol, index) => (
        <div key={protocol.protocol} className="flex items-center space-x-4">
          <div className="w-20 text-sm font-medium text-gray-600 truncate">
            {protocol.protocol}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-900">{protocol.transactions} 笔交易</span>
              <Badge variant={protocol.riskLevel === 'low' ? 'success' : protocol.riskLevel === 'medium' ? 'warning' : 'danger'}>
                {protocol.riskLevel}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(protocol.transactions / maxTransactions) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatValue(protocol.totalValue)}</span>
              <span>{protocol.successRate.toFixed(1)}% 成功率</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 安全警报列表组件
const AlertsList: React.FC<{ alerts: SecurityAlert[] }> = ({ alerts }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'high_risk_contract': return '高风险合约';
      case 'unusual_gas': return '异常 Gas';
      case 'failed_verification': return '验证失败';
      case 'suspicious_activity': return '可疑活动';
      default: return type;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无安全警报</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={alert.severity === 'critical' || alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info'}>
                  {getTypeLabel(alert.type)}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{alert.description}</p>
              <p className="text-sm text-gray-600 mb-2">{alert.recommendation}</p>
              <p className="text-xs text-gray-500 font-mono">{alert.contractAddress}</p>
            </div>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => contractAnalytics.acknowledgeAlert(alert.id)}
            >
              确认
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// 交易历史组件
const TransactionHistory: React.FC<{ transactions: ContractTransaction[] }> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无交易记录</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              时间
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              合约/函数
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              协议
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              价值
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              风险
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(tx.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{tx.functionName}</div>
                <div className="text-xs text-gray-500 font-mono">
                  {tx.contractAddress.slice(0, 8)}...{tx.contractAddress.slice(-6)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {tx.protocol || 'Unknown'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatValue(tx.value)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatGas(tx.gasUsed)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={tx.status === 'success' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'}>
                  {tx.status === 'success' ? '成功' : tx.status === 'failed' ? '失败' : '待确认'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={tx.riskLevel === 'low' ? 'success' : tx.riskLevel === 'medium' ? 'warning' : 'danger'}>
                  {tx.riskLevel === 'low' ? '低' : tx.riskLevel === 'medium' ? '中' : '高'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 主分析仪表板组件
const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<ContractPaymentStats | null>(null);
  const [protocolUsage, setProtocolUsage] = useState<ProtocolUsage[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [transactions, setTransactions] = useState<ContractTransaction[]>([]);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = contractAnalytics.getStats(timeRange);
      const protocolData = contractAnalytics.getProtocolUsage();
      const alertsData = contractAnalytics.getAlerts(false);
      const transactionData = contractAnalytics.getTransactionHistory(50);

      setStats(statsData);
      setProtocolUsage(protocolData);
      setAlerts(alertsData);
      setTransactions(transactionData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  // 导出数据
  const handleExportData = () => {
    const data = contractAnalytics.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 清除数据
  const handleClearData = () => {
    if (window.confirm('确定要清除所有分析数据吗？此操作不可撤销。')) {
      contractAnalytics.clearAllData();
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">合约支付分析</h1>
          <p className="text-gray-600">第三方合约支付统计和监控</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value={7}>最近 7 天</option>
            <option value={30}>最近 30 天</option>
            <option value={90}>最近 90 天</option>
          </select>
          <Button onClick={handleExportData} variant="secondary" size="sm">
            导出数据
          </Button>
          <Button onClick={handleClearData} variant="danger" size="sm">
            清除数据
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="总交易数"
            value={stats.totalTransactions}
            subtitle={`成功率 ${stats.successRate}%`}
            trend={stats.successRate > 90 ? 'up' : stats.successRate < 70 ? 'down' : 'neutral'}
          />
          <StatsCard
            title="总价值"
            value={formatValue(stats.totalValue)}
            subtitle={`${stats.totalTransactions} 笔交易`}
          />
          <StatsCard
            title="平均 Gas"
            value={formatGas(stats.averageGasUsed)}
            subtitle="每笔交易"
          />
          <StatsCard
            title="风险分布"
            value={`${stats.riskDistribution.high} 高风险`}
            subtitle={`${stats.riskDistribution.low} 低风险, ${stats.riskDistribution.medium} 中风险`}
            trend={stats.riskDistribution.high === 0 ? 'up' : stats.riskDistribution.high > 5 ? 'down' : 'neutral'}
          />
        </div>
      )}

      {/* 详细分析 */}
      <Tabs defaultValue="protocols" className="w-full">
        <TabsList>
          <TabsTrigger value="protocols">协议使用</TabsTrigger>
          <TabsTrigger value="alerts">安全警报</TabsTrigger>
          <TabsTrigger value="transactions">交易历史</TabsTrigger>
        </TabsList>

        <TabsContent value="protocols">
          <Card title="协议使用统计">
            {protocolUsage.length > 0 ? (
              <ProtocolChart protocols={protocolUsage} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>暂无协议使用数据</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card title={`安全警报 (${alerts.length})`}>
            <AlertsList alerts={alerts} />
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card title="交易历史">
            <TransactionHistory transactions={transactions} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;