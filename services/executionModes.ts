import { EventEmitter } from 'events';
import logger from './logger.js';

export enum ExecutionMode {
  TESTING = 'testing',
  PAPER = 'paper', 
  LIVE = 'live'
}

export interface ModeConfiguration {
  mode: ExecutionMode;
  useRealData: boolean;
  executeRealTrades: boolean;
  simulationSpeed?: number; // For testing mode
  riskLimits?: {
    maxPositionSize: number;
    maxDailyLoss: number;
    maxOrderValue: number;
  };
}

export interface MarketDataSource {
  symbol: string;
  price: number;
  timestamp: Date;
  volume?: number;
  source: 'SIMULATED' | 'LIVE_API' | 'TEST_DATA';
}

export class ExecutionModeManager extends EventEmitter {
  private static instance: ExecutionModeManager;
  private currentMode: ExecutionMode = ExecutionMode.TESTING;
  private configuration: ModeConfiguration;
  private marketDataInterval?: NodeJS.Timeout;
  private simulatedMarketData: Map<string, MarketDataSource> = new Map();

  constructor() {
    super();
    this.configuration = this.getDefaultConfiguration(ExecutionMode.TESTING);
    this.initializeMarketData();
  }

  static getInstance(): ExecutionModeManager {
    if (!ExecutionModeManager.instance) {
      ExecutionModeManager.instance = new ExecutionModeManager();
    }
    return ExecutionModeManager.instance;
  }

  // Switch execution mode with validation
  async switchMode(newMode: ExecutionMode, config?: Partial<ModeConfiguration>): Promise<boolean> {
    try {
      const oldMode = this.currentMode;
      
      logger.info(`Switching execution mode from ${oldMode} to ${newMode}`, 'EXECUTION_MODE', 'SWITCH', { oldMode, newMode });

      // Validate mode switch
      if (!this.validateModeSwitch(oldMode, newMode)) {
        throw new Error(`Invalid mode switch from ${oldMode} to ${newMode}`);
      }

      // Stop current mode operations
      await this.stopCurrentMode();

      // Update configuration
      this.currentMode = newMode;
      this.configuration = {
        ...this.getDefaultConfiguration(newMode),
        ...config
      };

      // Start new mode operations
      await this.startMode(newMode);

      // Emit mode change event
      this.emit('modeChanged', {
        oldMode,
        newMode,
        configuration: this.configuration
      });

      logger.info(`Successfully switched to ${newMode} mode`, 'EXECUTION_MODE', 'SWITCH_SUCCESS', { 
        mode: newMode,
        config: this.configuration 
      });

      return true;

    } catch (error) {
      logger.error('Failed to switch execution mode', 'EXECUTION_MODE', 'SWITCH_ERROR', {
        targetMode: newMode,
        currentMode: this.currentMode,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  // Get current mode and configuration
  getCurrentMode(): { mode: ExecutionMode; config: ModeConfiguration } {
    return {
      mode: this.currentMode,
      config: { ...this.configuration }
    };
  }

  // Check if real trades should be executed
  shouldExecuteRealTrades(): boolean {
    return this.configuration.executeRealTrades && this.currentMode === ExecutionMode.LIVE;
  }

  // Check if real market data should be used
  shouldUseRealData(): boolean {
    return this.configuration.useRealData && (
      this.currentMode === ExecutionMode.PAPER || 
      this.currentMode === ExecutionMode.LIVE
    );
  }

  // Get market data based on current mode
  async getMarketData(symbol: string): Promise<MarketDataSource | null> {
    switch (this.currentMode) {
      case ExecutionMode.TESTING:
        return this.getTestingModeData(symbol);
      
      case ExecutionMode.PAPER:
        return this.shouldUseRealData() 
          ? await this.getLiveMarketData(symbol)
          : this.getTestingModeData(symbol);
      
      case ExecutionMode.LIVE:
        return await this.getLiveMarketData(symbol);
      
      default:
        return null;
    }
  }

  // Execute trade based on current mode
  async executeTrade(tradeParams: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
  }): Promise<{ success: boolean; orderId?: string; simulated?: boolean }> {
    
    logger.info(`Executing trade in ${this.currentMode} mode`, 'EXECUTION_MODE', 'EXECUTE_TRADE', {
      mode: this.currentMode,
      trade: tradeParams
    });

    switch (this.currentMode) {
      case ExecutionMode.TESTING:
        return this.executeSimulatedTrade(tradeParams);
      
      case ExecutionMode.PAPER:
        return this.executeSimulatedTrade(tradeParams);
      
      case ExecutionMode.LIVE:
        return this.shouldExecuteRealTrades() 
          ? await this.executeRealTrade(tradeParams)
          : this.executeSimulatedTrade(tradeParams);
      
      default:
        return { success: false };
    }
  }

  // Validate risk limits for current mode
  validateRiskLimits(tradeParams: {
    symbol: string;
    quantity: number;
    price: number;
  }): { valid: boolean; violations?: string[] } {
    const violations: string[] = [];
    const { riskLimits } = this.configuration;

    if (!riskLimits) {
      return { valid: true };
    }

    const orderValue = tradeParams.quantity * tradeParams.price;

    if (tradeParams.quantity > riskLimits.maxPositionSize) {
      violations.push(`Position size ${tradeParams.quantity} exceeds limit ${riskLimits.maxPositionSize}`);
    }

    if (orderValue > riskLimits.maxOrderValue) {
      violations.push(`Order value ${orderValue} exceeds limit ${riskLimits.maxOrderValue}`);
    }

    return {
      valid: violations.length === 0,
      violations: violations.length > 0 ? violations : undefined
    };
  }

  private getDefaultConfiguration(mode: ExecutionMode): ModeConfiguration {
    const baseConfig = {
      mode,
      riskLimits: {
        maxPositionSize: 1000,
        maxDailyLoss: 10000,
        maxOrderValue: 50000
      }
    };

    switch (mode) {
      case ExecutionMode.TESTING:
        return {
          ...baseConfig,
          useRealData: false,
          executeRealTrades: false,
          simulationSpeed: 1.0
        };

      case ExecutionMode.PAPER:
        return {
          ...baseConfig,
          useRealData: true,
          executeRealTrades: false
        };

      case ExecutionMode.LIVE:
        return {
          ...baseConfig,
          useRealData: true,
          executeRealTrades: true,
          riskLimits: {
            maxPositionSize: 500, // More conservative for live
            maxDailyLoss: 5000,
            maxOrderValue: 25000
          }
        };

      default:
        return baseConfig;
    }
  }

  private validateModeSwitch(oldMode: ExecutionMode, newMode: ExecutionMode): boolean {
    // Add validation logic for mode switches
    if (oldMode === ExecutionMode.LIVE && newMode !== ExecutionMode.LIVE) {
      // Could add checks for open positions, pending orders, etc.
      logger.warn('Switching from live mode - ensure no active positions', 'EXECUTION_MODE', 'VALIDATION');
    }
    return true;
  }

  private async stopCurrentMode(): Promise<void> {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
      this.marketDataInterval = undefined;
    }
    
    logger.info(`Stopped ${this.currentMode} mode operations`, 'EXECUTION_MODE', 'STOP');
  }

  private async startMode(mode: ExecutionMode): Promise<void> {
    switch (mode) {
      case ExecutionMode.TESTING:
        this.startTestingMode();
        break;
      case ExecutionMode.PAPER:
        this.startPaperMode();
        break;
      case ExecutionMode.LIVE:
        this.startLiveMode();
        break;
    }

    logger.info(`Started ${mode} mode operations`, 'EXECUTION_MODE', 'START');
  }

  private startTestingMode(): void {
    // Generate simulated market data at specified speed
    const speed = this.configuration.simulationSpeed || 1.0;
    const interval = Math.floor(1000 / speed); // Base 1 second interval

    this.marketDataInterval = setInterval(() => {
      this.updateSimulatedMarketData();
    }, interval);
  }

  private startPaperMode(): void {
    // Start real-time data feeds but simulated execution
    this.initializeRealDataFeeds();
  }

  private startLiveMode(): void {
    // Start real-time data feeds and real execution
    this.initializeRealDataFeeds();
    this.initializeLiveExecution();
  }

  private initializeMarketData(): void {
    // Initialize with some common symbols
    const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'WIPRO'];
    symbols.forEach(symbol => {
      this.simulatedMarketData.set(symbol, {
        symbol,
        price: 1000 + Math.random() * 2000,
        timestamp: new Date(),
        volume: Math.floor(Math.random() * 10000),
        source: 'SIMULATED'
      });
    });
  }

  private updateSimulatedMarketData(): void {
    this.simulatedMarketData.forEach((data, symbol) => {
      // Simulate price movement
      const change = (Math.random() - 0.5) * data.price * 0.02; // ±2% max change
      const newPrice = Math.max(data.price + change, 1); // Ensure price stays positive

      const updatedData: MarketDataSource = {
        symbol,
        price: parseFloat(newPrice.toFixed(2)),
        timestamp: new Date(),
        volume: Math.floor(Math.random() * 10000),
        source: 'SIMULATED'
      };

      this.simulatedMarketData.set(symbol, updatedData);
      
      // Emit price update
      this.emit('marketData', updatedData);
    });
  }

  private getTestingModeData(symbol: string): MarketDataSource | null {
    return this.simulatedMarketData.get(symbol) || null;
  }

  private async getLiveMarketData(symbol: string): Promise<MarketDataSource | null> {
    // In a real implementation, this would fetch from live APIs
    // For now, return simulated data with 'LIVE_API' source
    const simulated = this.simulatedMarketData.get(symbol);
    if (simulated) {
      return {
        ...simulated,
        source: 'LIVE_API',
        timestamp: new Date()
      };
    }
    return null;
  }

  private executeSimulatedTrade(tradeParams: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
  }): { success: boolean; orderId: string; simulated: boolean } {
    
    const orderId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate execution success/failure
    const success = Math.random() > 0.05; // 95% success rate
    
    if (success) {
      logger.info(`Simulated trade executed successfully`, 'EXECUTION_MODE', 'SIMULATED_TRADE', {
        orderId,
        ...tradeParams
      });
    } else {
      logger.warn(`Simulated trade failed`, 'EXECUTION_MODE', 'SIMULATED_TRADE', {
        orderId,
        ...tradeParams
      });
    }

    return { success, orderId, simulated: true };
  }

  private async executeRealTrade(tradeParams: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
  }): Promise<{ success: boolean; orderId?: string; simulated?: boolean }> {
    
    logger.critical('LIVE TRADE EXECUTION ATTEMPTED', 'EXECUTION_MODE', 'LIVE_TRADE', tradeParams);
    
    // For safety, real implementation would go here
    // For now, prevent actual execution
    return {
      success: false
    };
  }

  private initializeRealDataFeeds(): void {
    // Initialize connections to real market data providers
    logger.info('Initializing real data feeds', 'EXECUTION_MODE', 'DATA_FEEDS');
  }

  private initializeLiveExecution(): void {
    // Initialize connections to brokers for live execution
    logger.info('Initializing live execution capabilities', 'EXECUTION_MODE', 'LIVE_EXECUTION');
  }

  // Get mode statistics
  getModeStatistics(): {
    currentMode: ExecutionMode;
    uptime: number;
    dataPoints: number;
    executedTrades: number;
  } {
    return {
      currentMode: this.currentMode,
      uptime: 0, // Would track actual uptime
      dataPoints: this.simulatedMarketData.size,
      executedTrades: 0 // Would track from database
    };
  }
}

export default ExecutionModeManager.getInstance();