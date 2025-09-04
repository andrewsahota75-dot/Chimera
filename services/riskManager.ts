interface RiskConfig {
  maxDrawdownPercent: number;
  maxPositionSize: number;
  maxDailyLoss: number;
  maxOrderValue: number;
  stopLossPercent: number;
  emergencyStopEnabled: boolean;
  portfolioPeakValue: number;
}

interface RiskMetrics {
  currentDrawdown: number;
  dailyPnL: number;
  totalPortfolioValue: number;
  largestPosition: number;
  violatedRules: string[];
  emergencyStop: boolean;
}

export class RiskManager {
  private static instance: RiskManager;
  private config: RiskConfig;
  private lastCheckTime: Date;
  private emergencyStopTriggered: boolean = false;
  private riskViolationCallbacks: ((violation: string) => void)[] = [];

  constructor() {
    this.config = {
      maxDrawdownPercent: 10, // 10% max drawdown
      maxPositionSize: 50000, // Max $50k per position
      maxDailyLoss: 5000, // Max $5k daily loss
      maxOrderValue: 10000, // Max $10k per order
      stopLossPercent: 5, // 5% stop loss
      emergencyStopEnabled: true,
      portfolioPeakValue: 125000 // Initial peak value
    };
    this.lastCheckTime = new Date();
  }

  static getInstance(): RiskManager {
    if (!RiskManager.instance) {
      RiskManager.instance = new RiskManager();
    }
    return RiskManager.instance;
  }

  // Configuration methods
  updateConfig(newConfig: Partial<RiskConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Risk management configuration updated:', this.config);
  }

  getConfig(): RiskConfig {
    return { ...this.config };
  }

  // Risk checking methods
  async validateOrder(order: { symbol: string; side: string; quantity: number; price: number }): Promise<{ allowed: boolean; reason?: string }> {
    if (this.emergencyStopTriggered) {
      return { allowed: false, reason: 'Emergency stop is active - no new orders allowed' };
    }

    const orderValue = order.quantity * order.price;
    
    // Check order value limit
    if (orderValue > this.config.maxOrderValue) {
      this.notifyRiskViolation(`Order value $${orderValue.toFixed(2)} exceeds maximum allowed $${this.config.maxOrderValue}`);
      return { allowed: false, reason: `Order value exceeds maximum limit of $${this.config.maxOrderValue}` };
    }

    // Check position size after order
    const currentPositions = await this.getCurrentPositions();
    const existingPosition = currentPositions.find(p => p.symbol === order.symbol);
    let newPositionValue = orderValue;
    
    if (existingPosition && order.side === 'BUY') {
      newPositionValue = existingPosition.quantity * existingPosition.currentPrice + orderValue;
    } else if (existingPosition && order.side === 'SELL') {
      newPositionValue = Math.max(0, existingPosition.quantity * existingPosition.currentPrice - orderValue);
    }

    if (newPositionValue > this.config.maxPositionSize) {
      this.notifyRiskViolation(`Position value $${newPositionValue.toFixed(2)} would exceed maximum allowed $${this.config.maxPositionSize}`);
      return { allowed: false, reason: `Position would exceed maximum size limit of $${this.config.maxPositionSize}` };
    }

    return { allowed: true };
  }

  async checkRiskLimits(): Promise<RiskMetrics> {
    const positions = await this.getCurrentPositions();
    const portfolioStats = await this.getPortfolioStats();
    
    const currentDrawdown = ((this.config.portfolioPeakValue - portfolioStats.totalValue) / this.config.portfolioPeakValue) * 100;
    const dailyPnL = portfolioStats.dayChange;
    const largestPosition = Math.max(...positions.map(p => p.quantity * p.currentPrice), 0);
    
    const violatedRules: string[] = [];
    let shouldTriggerEmergencyStop = false;

    // Check drawdown limit
    if (currentDrawdown > this.config.maxDrawdownPercent) {
      violatedRules.push(`Maximum drawdown exceeded: ${currentDrawdown.toFixed(2)}% > ${this.config.maxDrawdownPercent}%`);
      shouldTriggerEmergencyStop = true;
    }

    // Check daily loss limit
    if (dailyPnL < -this.config.maxDailyLoss) {
      violatedRules.push(`Maximum daily loss exceeded: $${dailyPnL.toFixed(2)} < -$${this.config.maxDailyLoss}`);
      shouldTriggerEmergencyStop = true;
    }

    // Check position size limits
    if (largestPosition > this.config.maxPositionSize) {
      violatedRules.push(`Position size exceeded: $${largestPosition.toFixed(2)} > $${this.config.maxPositionSize}`);
    }

    // Update portfolio peak
    if (portfolioStats.totalValue > this.config.portfolioPeakValue) {
      this.config.portfolioPeakValue = portfolioStats.totalValue;
    }

    // Trigger emergency stop if needed
    if (shouldTriggerEmergencyStop && this.config.emergencyStopEnabled && !this.emergencyStopTriggered) {
      await this.triggerEmergencyStop(violatedRules.join('; '));
    }

    const riskMetrics: RiskMetrics = {
      currentDrawdown,
      dailyPnL,
      totalPortfolioValue: portfolioStats.totalValue,
      largestPosition,
      violatedRules,
      emergencyStop: this.emergencyStopTriggered
    };

    // Notify violations
    violatedRules.forEach(violation => this.notifyRiskViolation(violation));

    return riskMetrics;
  }

  async triggerEmergencyStop(reason: string): Promise<void> {
    if (this.emergencyStopTriggered) return;
    
    this.emergencyStopTriggered = true;
    console.error(`🚨 EMERGENCY STOP TRIGGERED: ${reason}`);
    
    // In a real system, this would:
    // 1. Cancel all open orders
    // 2. Close all positions (market orders)
    // 3. Send critical alerts
    // 4. Lock new order placement
    
    this.notifyRiskViolation(`EMERGENCY STOP ACTIVATED: ${reason}`);
    
    // Simulate emergency actions
    console.log('📞 Sending emergency alerts to all channels');
    console.log('❌ Cancelling all open orders');
    console.log('💰 Liquidating all positions');
    console.log('🔒 Blocking new order placement');
  }

  resetEmergencyStop(): void {
    this.emergencyStopTriggered = false;
    console.log('✅ Emergency stop reset - trading resumed');
    this.notifyRiskViolation('Emergency stop reset - normal trading resumed');
  }

  isEmergencyStopActive(): boolean {
    return this.emergencyStopTriggered;
  }

  // Stop loss monitoring
  async monitorStopLosses(): Promise<void> {
    const positions = await this.getCurrentPositions();
    
    for (const position of positions) {
      const unrealizedPnLPercent = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100;
      
      // Check if position hit stop loss
      if (unrealizedPnLPercent <= -this.config.stopLossPercent) {
        console.warn(`⚠️ Stop loss triggered for ${position.symbol}: ${unrealizedPnLPercent.toFixed(2)}%`);
        this.notifyRiskViolation(`Stop loss triggered for ${position.symbol}: ${unrealizedPnLPercent.toFixed(2)}%`);
        
        // In a real system, this would place a market sell order
        console.log(`📉 Would trigger market sell for ${position.symbol}`);
      }
    }
  }

  // Event subscription
  onRiskViolation(callback: (violation: string) => void): void {
    this.riskViolationCallbacks.push(callback);
  }

  private notifyRiskViolation(violation: string): void {
    this.riskViolationCallbacks.forEach(callback => {
      try {
        callback(violation);
      } catch (error) {
        console.error('Error in risk violation callback:', error);
      }
    });
  }

  // Helper methods to get current data (mock implementations)
  private async getCurrentPositions(): Promise<any[]> {
    // In a real implementation, this would fetch from the database or order service
    return [
      { symbol: 'RELIANCE', quantity: 50, avgPrice: 2400, currentPrice: 2450 },
      { symbol: 'TCS', quantity: 25, avgPrice: 3200, currentPrice: 3250 }
    ];
  }

  private async getPortfolioStats(): Promise<{ totalValue: number; dayChange: number }> {
    // In a real implementation, this would fetch from the portfolio service
    return {
      totalValue: 125000,
      dayChange: -2000 // Simulate a losing day for testing
    };
  }

  // Continuous monitoring
  startContinuousMonitoring(intervalMs: number = 30000): void {
    setInterval(async () => {
      try {
        await this.checkRiskLimits();
        await this.monitorStopLosses();
      } catch (error) {
        console.error('Error in risk monitoring:', error);
      }
    }, intervalMs);
    
    console.log(`🔍 Risk monitoring started (interval: ${intervalMs}ms)`);
  }

  // Risk summary for UI
  async getRiskSummary(): Promise<{
    status: 'SAFE' | 'WARNING' | 'DANGER' | 'EMERGENCY_STOP';
    metrics: RiskMetrics;
    recommendations: string[];
  }> {
    const metrics = await this.checkRiskLimits();
    const recommendations: string[] = [];
    let status: 'SAFE' | 'WARNING' | 'DANGER' | 'EMERGENCY_STOP' = 'SAFE';

    if (metrics.emergencyStop) {
      status = 'EMERGENCY_STOP';
      recommendations.push('Emergency stop is active - contact administrator');
    } else if (metrics.violatedRules.length > 0) {
      status = 'DANGER';
      recommendations.push('Immediate risk management action required');
      recommendations.push('Consider reducing position sizes');
    } else if (metrics.currentDrawdown > this.config.maxDrawdownPercent * 0.7) {
      status = 'WARNING';
      recommendations.push('Approaching maximum drawdown limit');
      recommendations.push('Monitor positions closely');
    } else if (metrics.dailyPnL < -this.config.maxDailyLoss * 0.7) {
      status = 'WARNING';
      recommendations.push('Approaching daily loss limit');
      recommendations.push('Consider stopping new trades for today');
    }

    return { status, metrics, recommendations };
  }
}