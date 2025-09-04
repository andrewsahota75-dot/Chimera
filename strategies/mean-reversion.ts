import { IStrategy, IBroker, Tick, Order, OrderSide } from '../packages/shared/src/interfaces';
import { Logger } from '@nestjs/common';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface MeanReversionConfig {
  lookback: number;
  threshold: number;
  stopLoss: number;
  positionSize?: number;
  accountPercentage: number;
}

export class MeanReversionStrategy implements IStrategy {
  private readonly logger = new Logger(MeanReversionStrategy.name);
  private config: MeanReversionConfig;
  private priceHistory: number[] = [];
  
  constructor(
    public readonly id: string,
    public readonly symbol: string,
    private readonly broker: IBroker,
  ) {
    this.loadConfig();
    this.logger.log(`Initialized MeanReversionStrategy [${id}] for ${symbol}`);
  }

  private loadConfig() {
    try {
      const configPath = path.join(__dirname, 'mean-reversion.yaml');
      const configFile = fs.readFileSync(configPath, 'utf8');
      this.config = yaml.load(configFile) as MeanReversionConfig;
      this.logger.log(`Loaded config: ${JSON.stringify(this.config)}`);
    } catch (error) {
      this.logger.error('Failed to load config, using defaults', error);
      this.config = {
        lookback: 20,
        threshold: 2.0,
        stopLoss: 1.5,
        accountPercentage: 2.0
      };
    }
  }

  public async onTick(tick: Tick): Promise<void> {
    this.logger.debug(`[${this.id}] Received tick: ${tick.price}`);
    
    this.priceHistory.push(tick.price);
    
    // Keep only the last 'lookback' prices
    if (this.priceHistory.length > this.config.lookback) {
      this.priceHistory.shift();
    }
    
    // Need enough data points
    if (this.priceHistory.length < this.config.lookback) {
      return;
    }
    
    // Calculate mean and standard deviation
    const mean = this.priceHistory.reduce((a, b) => a + b) / this.priceHistory.length;
    const variance = this.priceHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.priceHistory.length;
    const stdDev = Math.sqrt(variance);
    
    const currentPrice = tick.price;
    const deviation = (currentPrice - mean) / stdDev;
    
    try {
      // Mean reversion logic
      if (deviation > this.config.threshold) {
        // Price is too high, sell signal
        const quantity = this.calculatePositionSize(currentPrice);
        await this.broker.placeOrder({
          symbol: this.symbol,
          side: OrderSide.SELL,
          type: 'MARKET',
          quantity: quantity,
        });
        this.logger.log(`[${this.id}] Placed SELL order - deviation: ${deviation.toFixed(2)}`);
      } else if (deviation < -this.config.threshold) {
        // Price is too low, buy signal
        const quantity = this.calculatePositionSize(currentPrice);
        await this.broker.placeOrder({
          symbol: this.symbol,
          side: OrderSide.BUY,
          type: 'MARKET',
          quantity: quantity,
        });
        this.logger.log(`[${this.id}] Placed BUY order - deviation: ${deviation.toFixed(2)}`);
      }
    } catch (error) {
      this.logger.error(`[${this.id}] Error placing order`, error.message);
    }
  }
  
  private calculatePositionSize(price: number): number {
    // Use strategy-specific position size if provided, otherwise use account percentage
    if (this.config.positionSize) {
      return this.config.positionSize;
    }
    
    // Fallback to account percentage-based sizing
    // This would typically get account balance from the broker
    const accountBalance = 100000; // Mock account balance
    const positionValue = accountBalance * (this.config.accountPercentage / 100);
    return Math.floor(positionValue / price);
  }
  
  public async onFill(order: Order): Promise<void> {
    this.logger.log(`[${this.id}] Order filled: ${JSON.stringify(order)}`);
    // Could implement stop-loss logic here based on config
  }
  
  public getConfig(): MeanReversionConfig {
    return this.config;
  }
  
  public updateConfig(newConfig: Partial<MeanReversionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    this.logger.log(`[${this.id}] Config updated: ${JSON.stringify(this.config)}`);
  }
  
  private saveConfig(): void {
    try {
      const configPath = path.join(__dirname, 'mean-reversion.yaml');
      const yamlStr = yaml.dump(this.config);
      fs.writeFileSync(configPath, yamlStr, 'utf8');
    } catch (error) {
      this.logger.error('Failed to save config', error);
    }
  }
}