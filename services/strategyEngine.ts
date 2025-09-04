import { RiskManager } from './riskManager';

export interface IStrategy {
  id: string;
  name: string;
  symbol: string;
  isActive: boolean;
  parameters: Record<string, any>;
  
  // Core methods
  initialize(): Promise<void>;
  onTick(tick: { symbol: string; price: number; timestamp: number }): Promise<void>;
  onOrderFilled(order: any): Promise<void>;
  destroy(): Promise<void>;
  
  // Signal generation (standardized approach)
  generateSignals(): Promise<TradingSignal[]>;
  
  // Strategy info
  getStatus(): StrategyStatus;
  getPerformanceMetrics(): StrategyPerformance;
}

export interface TradingSignal {
  id: string;
  strategyId: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-100, signal confidence
  price?: number;
  quantity?: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface StrategyStatus {
  id: string;
  name: string;
  isRunning: boolean;
  lastSignalTime?: Date;
  totalSignals: number;
  activeTrades: number;
  errorCount: number;
  lastError?: string;
}

export interface StrategyPerformance {
  totalTrades: number;
  winRate: number;
  profitLoss: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  sharpeRatio?: number;
}

export class StrategyEngine {
  private static instance: StrategyEngine;
  private strategies: Map<string, IStrategy> = new Map();
  private riskManager: RiskManager;
  private isRunning: boolean = false;
  private signalListeners: ((signal: TradingSignal) => void)[] = [];
  private statusListeners: ((status: StrategyStatus) => void)[] = [];
  
  constructor() {
    this.riskManager = RiskManager.getInstance();
  }
  
  static getInstance(): StrategyEngine {
    if (!StrategyEngine.instance) {
      StrategyEngine.instance = new StrategyEngine();
    }
    return StrategyEngine.instance;
  }

  // Strategy management
  async registerStrategy(strategy: IStrategy): Promise<void> {
    try {
      await strategy.initialize();
      this.strategies.set(strategy.id, strategy);
      console.log(`✅ Strategy registered: ${strategy.name} (${strategy.id})`);
      
      this.notifyStatusUpdate(strategy.getStatus());
    } catch (error) {
      console.error(`❌ Failed to register strategy ${strategy.name}:`, error);
      throw error;
    }
  }

  async removeStrategy(strategyId: string): Promise<void> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    try {
      await strategy.destroy();
      this.strategies.delete(strategyId);
      console.log(`🗑️ Strategy removed: ${strategy.name} (${strategyId})`);
    } catch (error) {
      console.error(`❌ Error removing strategy ${strategyId}:`, error);
      throw error;
    }
  }

  // Strategy control
  async startStrategy(strategyId: string): Promise<void> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    strategy.isActive = true;
    console.log(`▶️ Strategy started: ${strategy.name}`);
    this.notifyStatusUpdate(strategy.getStatus());
  }

  async stopStrategy(strategyId: string): Promise<void> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    strategy.isActive = false;
    console.log(`⏸️ Strategy stopped: ${strategy.name}`);
    this.notifyStatusUpdate(strategy.getStatus());
  }

  async startEngine(): Promise<void> {
    if (this.isRunning) {
      console.log('Strategy engine is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Strategy Engine started');

    // Start signal processing loop
    this.startSignalProcessing();
  }

  async stopEngine(): Promise<void> {
    if (!this.isRunning) {
      console.log('Strategy engine is not running');
      return;
    }

    this.isRunning = false;

    // Stop all active strategies
    for (const [id, strategy] of this.strategies) {
      if (strategy.isActive) {
        await this.stopStrategy(id);
      }
    }

    console.log('⏹️ Strategy Engine stopped');
  }

  // Market data routing
  async onMarketTick(tick: { symbol: string; price: number; timestamp: number }): Promise<void> {
    if (!this.isRunning) return;

    // Route tick to relevant strategies
    for (const [id, strategy] of this.strategies) {
      if (strategy.isActive && strategy.symbol === tick.symbol) {
        try {
          await strategy.onTick(tick);
        } catch (error) {
          console.error(`❌ Error in strategy ${strategy.name} onTick:`, error);
          this.handleStrategyError(strategy, error);
        }
      }
    }
  }

  // Signal processing
  private async startSignalProcessing(): void {
    const processSignals = async () => {
      if (!this.isRunning) return;

      for (const [id, strategy] of this.strategies) {
        if (!strategy.isActive) continue;

        try {
          const signals = await strategy.generateSignals();
          
          for (const signal of signals) {
            await this.processSignal(signal);
          }
        } catch (error) {
          console.error(`❌ Error processing signals for ${strategy.name}:`, error);
          this.handleStrategyError(strategy, error);
        }
      }

      // Schedule next processing cycle
      setTimeout(processSignals, 1000); // Process every second
    };

    processSignals();
  }

  private async processSignal(signal: TradingSignal): Promise<void> {
    // Risk validation
    if (signal.action === 'BUY' || signal.action === 'SELL') {
      const orderParams = {
        symbol: signal.symbol,
        side: signal.action,
        quantity: signal.quantity || 10, // Default quantity
        price: signal.price || 0
      };

      const riskCheck = await this.riskManager.validateOrder(orderParams);
      
      if (!riskCheck.allowed) {
        console.warn(`🚫 Signal rejected by risk manager: ${riskCheck.reason}`);
        return;
      }
    }

    // Notify signal listeners (order service, UI, etc.)
    this.notifySignalGenerated(signal);
    
    console.log(`📊 Signal generated: ${signal.action} ${signal.symbol} (${signal.strength}% confidence)`);
  }

  // Strategy error handling
  private handleStrategyError(strategy: IStrategy, error: any): void {
    console.error(`Strategy ${strategy.name} encountered error:`, error);
    
    // For now, just stop the problematic strategy
    strategy.isActive = false;
    this.notifyStatusUpdate(strategy.getStatus());
  }

  // Event listeners
  onSignalGenerated(callback: (signal: TradingSignal) => void): void {
    this.signalListeners.push(callback);
  }

  onStatusUpdate(callback: (status: StrategyStatus) => void): void {
    this.statusListeners.push(callback);
  }

  private notifySignalGenerated(signal: TradingSignal): void {
    this.signalListeners.forEach(callback => {
      try {
        callback(signal);
      } catch (error) {
        console.error('Error in signal listener:', error);
      }
    });
  }

  private notifyStatusUpdate(status: StrategyStatus): void {
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  // Query methods
  getActiveStrategies(): IStrategy[] {
    return Array.from(this.strategies.values()).filter(s => s.isActive);
  }

  getAllStrategies(): IStrategy[] {
    return Array.from(this.strategies.values());
  }

  getStrategy(id: string): IStrategy | undefined {
    return this.strategies.get(id);
  }

  getEngineStatus(): {
    isRunning: boolean;
    totalStrategies: number;
    activeStrategies: number;
    totalSignalsToday: number;
  } {
    const activeCount = this.getActiveStrategies().length;
    
    return {
      isRunning: this.isRunning,
      totalStrategies: this.strategies.size,
      activeStrategies: activeCount,
      totalSignalsToday: 0 // This would be tracked in a real implementation
    };
  }
}

// Example strategy implementation
export class MovingAverageStrategy implements IStrategy {
  id: string;
  name: string;
  symbol: string;
  isActive: boolean = false;
  parameters: Record<string, any>;
  
  private prices: number[] = [];
  private lastSignalTime?: Date;
  private signalCount: number = 0;
  
  constructor(id: string, symbol: string, parameters: { shortPeriod: number; longPeriod: number }) {
    this.id = id;
    this.name = 'Moving Average Crossover';
    this.symbol = symbol;
    this.parameters = parameters;
  }

  async initialize(): Promise<void> {
    this.prices = [];
    console.log(`🔧 Initializing ${this.name} for ${this.symbol}`);
  }

  async onTick(tick: { symbol: string; price: number; timestamp: number }): Promise<void> {
    if (tick.symbol !== this.symbol) return;
    
    this.prices.push(tick.price);
    
    // Keep only the prices we need
    const maxPeriod = Math.max(this.parameters.shortPeriod, this.parameters.longPeriod);
    if (this.prices.length > maxPeriod * 2) {
      this.prices = this.prices.slice(-maxPeriod * 2);
    }
  }

  async onOrderFilled(order: any): Promise<void> {
    console.log(`📝 Strategy ${this.name} notified of filled order: ${order.id}`);
  }

  async destroy(): Promise<void> {
    this.prices = [];
    this.isActive = false;
    console.log(`🗑️ Destroyed ${this.name} strategy`);
  }

  async generateSignals(): Promise<TradingSignal[]> {
    if (this.prices.length < this.parameters.longPeriod) {
      return []; // Not enough data
    }

    const shortMA = this.calculateMA(this.parameters.shortPeriod);
    const longMA = this.calculateMA(this.parameters.longPeriod);
    const prevShortMA = this.calculateMA(this.parameters.shortPeriod, 1);
    const prevLongMA = this.calculateMA(this.parameters.longPeriod, 1);

    const signals: TradingSignal[] = [];

    // Bullish crossover
    if (prevShortMA <= prevLongMA && shortMA > longMA) {
      signals.push({
        id: `${this.id}_${Date.now()}`,
        strategyId: this.id,
        symbol: this.symbol,
        action: 'BUY',
        strength: 75,
        timestamp: new Date(),
        metadata: { shortMA, longMA, type: 'bullish_crossover' }
      });
    }
    // Bearish crossover
    else if (prevShortMA >= prevLongMA && shortMA < longMA) {
      signals.push({
        id: `${this.id}_${Date.now()}`,
        strategyId: this.id,
        symbol: this.symbol,
        action: 'SELL',
        strength: 75,
        timestamp: new Date(),
        metadata: { shortMA, longMA, type: 'bearish_crossover' }
      });
    }

    if (signals.length > 0) {
      this.lastSignalTime = new Date();
      this.signalCount += signals.length;
    }

    return signals;
  }

  private calculateMA(period: number, offset: number = 0): number {
    const endIndex = this.prices.length - offset;
    const startIndex = endIndex - period;
    
    if (startIndex < 0) return 0;
    
    const relevantPrices = this.prices.slice(startIndex, endIndex);
    return relevantPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  getStatus(): StrategyStatus {
    return {
      id: this.id,
      name: this.name,
      isRunning: this.isActive,
      lastSignalTime: this.lastSignalTime,
      totalSignals: this.signalCount,
      activeTrades: 0,
      errorCount: 0
    };
  }

  getPerformanceMetrics(): StrategyPerformance {
    return {
      totalTrades: 0,
      winRate: 0,
      profitLoss: 0,
      avgWin: 0,
      avgLoss: 0,
      maxDrawdown: 0
    };
  }
}