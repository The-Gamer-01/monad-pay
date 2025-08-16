// 分析仪表板扩展 - 第三方合约支付统计和监控

export interface ContractPaymentStats {
  totalTransactions: number;
  totalValue: string; // 以 ETH 为单位
  successRate: number;
  averageGasUsed: number;
  mostUsedProtocols: {
    protocol: string;
    count: number;
    percentage: number;
  }[];
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  timeSeriesData: {
    date: string;
    transactions: number;
    value: string;
    gasUsed: number;
  }[];
}

export interface ContractTransaction {
  id: string;
  timestamp: number;
  contractAddress: string;
  functionName: string;
  protocol?: string;
  category?: string;
  value: string;
  gasUsed: number;
  gasPrice: string;
  status: 'pending' | 'success' | 'failed';
  riskLevel: 'low' | 'medium' | 'high';
  securityScore: number;
  userAddress: string;
  txHash?: string;
  errorMessage?: string;
}

export interface ProtocolUsage {
  protocol: string;
  category: string;
  transactions: number;
  totalValue: string;
  averageValue: string;
  successRate: number;
  lastUsed: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SecurityAlert {
  id: string;
  timestamp: number;
  type: 'high_risk_contract' | 'unusual_gas' | 'failed_verification' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  contractAddress: string;
  description: string;
  recommendation: string;
  acknowledged: boolean;
}

// 本地存储键
const STORAGE_KEYS = {
  TRANSACTIONS: 'contract_payment_transactions',
  ALERTS: 'security_alerts',
  SETTINGS: 'analytics_settings'
} as const;

// 分析设置
export interface AnalyticsSettings {
  enableTracking: boolean;
  retentionDays: number;
  alertThresholds: {
    gasPrice: number; // Gwei
    transactionValue: string; // ETH
    failureRate: number; // 百分比
  };
  autoCleanup: boolean;
}

const DEFAULT_SETTINGS: AnalyticsSettings = {
  enableTracking: true,
  retentionDays: 30,
  alertThresholds: {
    gasPrice: 100, // 100 Gwei
    transactionValue: '1.0', // 1 ETH
    failureRate: 20 // 20%
  },
  autoCleanup: true
};

// 检查是否在客户端环境
const isClient = typeof window !== 'undefined';

// 数据管理类
export class ContractPaymentAnalytics {
  private transactions: ContractTransaction[] = [];
  private alerts: SecurityAlert[] = [];
  private settings: AnalyticsSettings;

  constructor() {
    this.settings = this.loadSettings();
    this.loadData();
    
    if (this.settings.autoCleanup) {
      this.cleanupOldData();
    }
  }

  // 加载设置
  private loadSettings(): AnalyticsSettings {
    if (!isClient) {
      return DEFAULT_SETTINGS;
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  // 保存设置
  public updateSettings(newSettings: Partial<AnalyticsSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (isClient) {
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }
  }

  // 加载数据
  private loadData(): void {
    if (!isClient) {
      this.transactions = [];
      this.alerts = [];
      return;
    }
    
    try {
      const transactionsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const alertsData = localStorage.getItem(STORAGE_KEYS.ALERTS);
      
      this.transactions = transactionsData ? JSON.parse(transactionsData) : [];
      this.alerts = alertsData ? JSON.parse(alertsData) : [];
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      this.transactions = [];
      this.alerts = [];
    }
  }

  // 保存数据
  private saveData(): void {
    if (!isClient) {
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to save analytics data:', error);
    }
  }

  // 清理旧数据
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (this.settings.retentionDays * 24 * 60 * 60 * 1000);
    
    this.transactions = this.transactions.filter(tx => tx.timestamp > cutoffTime);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    
    this.saveData();
  }

  // 记录交易
  public recordTransaction(transaction: Omit<ContractTransaction, 'id' | 'timestamp'>): string {
    if (!this.settings.enableTracking) return '';

    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTransaction: ContractTransaction = {
      ...transaction,
      id,
      timestamp: Date.now()
    };

    this.transactions.push(newTransaction);
    this.saveData();

    // 检查是否需要生成警报
    this.checkForAlerts(newTransaction);

    return id;
  }

  // 更新交易状态
  public updateTransaction(id: string, updates: Partial<ContractTransaction>): void {
    const index = this.transactions.findIndex(tx => tx.id === id);
    if (index !== -1) {
      this.transactions[index] = { ...this.transactions[index], ...updates };
      this.saveData();
    }
  }

  // 检查警报条件
  private checkForAlerts(transaction: ContractTransaction): void {
    const alerts: SecurityAlert[] = [];

    // 高风险合约警报
    if (transaction.riskLevel === 'high') {
      alerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: 'high_risk_contract',
        severity: 'high',
        contractAddress: transaction.contractAddress,
        description: `检测到高风险合约交易: ${transaction.contractAddress}`,
        recommendation: '建议仔细审查合约代码和交易参数',
        acknowledged: false
      });
    }

    // 异常 Gas 价格警报
    const gasPriceGwei = parseFloat(transaction.gasPrice) / 1e9;
    if (gasPriceGwei > this.settings.alertThresholds.gasPrice) {
      alerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: 'unusual_gas',
        severity: 'medium',
        contractAddress: transaction.contractAddress,
        description: `异常高的 Gas 价格: ${gasPriceGwei.toFixed(2)} Gwei`,
        recommendation: '考虑等待网络拥堵缓解后再进行交易',
        acknowledged: false
      });
    }

    // 验证失败警报
    if (transaction.securityScore < 50) {
      alerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: 'failed_verification',
        severity: 'medium',
        contractAddress: transaction.contractAddress,
        description: `合约安全评分较低: ${transaction.securityScore}/100`,
        recommendation: '建议进行额外的安全审查',
        acknowledged: false
      });
    }

    this.alerts.push(...alerts);
    this.saveData();
  }

  // 获取统计数据
  public getStats(days: number = 30): ContractPaymentStats {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentTransactions = this.transactions.filter(tx => tx.timestamp > cutoffTime);

    const totalTransactions = recentTransactions.length;
    const successfulTransactions = recentTransactions.filter(tx => tx.status === 'success');
    const successRate = totalTransactions > 0 ? (successfulTransactions.length / totalTransactions) * 100 : 0;

    // 计算总价值
    const totalValue = recentTransactions.reduce((sum, tx) => {
      return sum + parseFloat(tx.value || '0');
    }, 0);

    // 计算平均 Gas 使用量
    const averageGasUsed = totalTransactions > 0 
      ? recentTransactions.reduce((sum, tx) => sum + tx.gasUsed, 0) / totalTransactions 
      : 0;

    // 协议使用统计
    const protocolCounts = recentTransactions.reduce((acc, tx) => {
      const protocol = tx.protocol || 'Unknown';
      acc[protocol] = (acc[protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedProtocols = Object.entries(protocolCounts)
      .map(([protocol, count]) => ({
        protocol,
        count,
        percentage: (count / totalTransactions) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 风险分布
    const riskDistribution = recentTransactions.reduce(
      (acc, tx) => {
        acc[tx.riskLevel]++;
        return acc;
      },
      { low: 0, medium: 0, high: 0 }
    );

    // 时间序列数据
    const timeSeriesData = this.generateTimeSeriesData(recentTransactions, days);

    return {
      totalTransactions,
      totalValue: totalValue.toFixed(6),
      successRate: Math.round(successRate * 100) / 100,
      averageGasUsed: Math.round(averageGasUsed),
      mostUsedProtocols,
      riskDistribution,
      timeSeriesData
    };
  }

  // 生成时间序列数据
  private generateTimeSeriesData(transactions: ContractTransaction[], days: number) {
    const data: Record<string, { transactions: number; value: number; gasUsed: number }> = {};
    
    // 初始化所有日期
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      data[dateStr] = { transactions: 0, value: 0, gasUsed: 0 };
    }

    // 填充实际数据
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      if (data[date]) {
        data[date].transactions++;
        data[date].value += parseFloat(tx.value || '0');
        data[date].gasUsed += tx.gasUsed;
      }
    });

    return Object.entries(data)
      .map(([date, stats]) => ({
        date,
        transactions: stats.transactions,
        value: stats.value.toFixed(6),
        gasUsed: stats.gasUsed
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // 获取协议使用情况
  public getProtocolUsage(): ProtocolUsage[] {
    const protocolStats: Record<string, {
      transactions: ContractTransaction[];
      category: string;
    }> = {};

    this.transactions.forEach(tx => {
      const protocol = tx.protocol || 'Unknown';
      if (!protocolStats[protocol]) {
        protocolStats[protocol] = {
          transactions: [],
          category: tx.category || 'other'
        };
      }
      protocolStats[protocol].transactions.push(tx);
    });

    return Object.entries(protocolStats).map(([protocol, data]) => {
      const transactions = data.transactions;
      const totalValue = transactions.reduce((sum, tx) => sum + parseFloat(tx.value || '0'), 0);
      const successfulTxs = transactions.filter(tx => tx.status === 'success');
      const successRate = transactions.length > 0 ? (successfulTxs.length / transactions.length) * 100 : 0;
      const lastUsed = Math.max(...transactions.map(tx => tx.timestamp));
      
      // 计算风险等级
      const riskScores = transactions.map(tx => {
        switch (tx.riskLevel) {
          case 'low': return 1;
          case 'medium': return 2;
          case 'high': return 3;
          default: return 2;
        }
      });
      const avgRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
      const riskLevel: 'low' | 'medium' | 'high' = avgRiskScore <= 1.5 ? 'low' : avgRiskScore <= 2.5 ? 'medium' : 'high';

      return {
        protocol,
        category: data.category,
        transactions: transactions.length,
        totalValue: totalValue.toFixed(6),
        averageValue: (totalValue / transactions.length).toFixed(6),
        successRate: Math.round(successRate * 100) / 100,
        lastUsed,
        riskLevel
      };
    }).sort((a, b) => b.transactions - a.transactions);
  }

  // 获取安全警报
  public getAlerts(acknowledged: boolean = false): SecurityAlert[] {
    return this.alerts
      .filter(alert => alert.acknowledged === acknowledged)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // 确认警报
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.saveData();
    }
  }

  // 获取交易历史
  public getTransactionHistory(limit: number = 100): ContractTransaction[] {
    return this.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // 导出数据
  public exportData(): {
    transactions: ContractTransaction[];
    alerts: SecurityAlert[];
    settings: AnalyticsSettings;
    exportTime: number;
  } {
    return {
      transactions: this.transactions,
      alerts: this.alerts,
      settings: this.settings,
      exportTime: Date.now()
    };
  }

  // 导入数据
  public importData(data: {
    transactions?: ContractTransaction[];
    alerts?: SecurityAlert[];
    settings?: AnalyticsSettings;
  }): void {
    if (data.transactions) {
      this.transactions = [...this.transactions, ...data.transactions];
    }
    if (data.alerts) {
      this.alerts = [...this.alerts, ...data.alerts];
    }
    if (data.settings) {
      this.settings = { ...this.settings, ...data.settings };
    }
    this.saveData();
  }

  // 清除所有数据
  public clearAllData(): void {
    this.transactions = [];
    this.alerts = [];
    
    if (isClient) {
      try {
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        localStorage.removeItem(STORAGE_KEYS.ALERTS);
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }
    }
  }
}

// 全局分析实例
export const contractAnalytics = new ContractPaymentAnalytics();

// 工具函数
export const formatValue = (value: string): string => {
  const num = parseFloat(value);
  if (num === 0) return '0 ETH';
  if (num < 0.001) return `${(num * 1000).toFixed(3)} mETH`;
  if (num < 1) return `${num.toFixed(6)} ETH`;
  return `${num.toFixed(3)} ETH`;
};

export const formatGas = (gas: number): string => {
  if (gas < 1000) return `${gas}`;
  if (gas < 1000000) return `${(gas / 1000).toFixed(1)}K`;
  return `${(gas / 1000000).toFixed(1)}M`;
};

export const getRiskColor = (riskLevel: 'low' | 'medium' | 'high'): string => {
  switch (riskLevel) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getStatusColor = (status: 'pending' | 'success' | 'failed'): string => {
  switch (status) {
    case 'success': return 'text-green-600';
    case 'failed': return 'text-red-600';
    case 'pending': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
};