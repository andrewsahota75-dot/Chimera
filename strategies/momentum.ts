import { IStrategy, IBroker, Tick, Order, OrderSide } from '../packages/shared/src/interfaces';
import { Logger } from '@nestjs/common';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface MomentumConfig {
  period: number;
  rsiThreshold: number;
  stopLoss: number;
  takeProfit: number;
  positionSize?: number;
  accountPercentage: number;
}

export class MomentumStrategy implements IStrategy {
  private readonly logger = new Logger(MomentumStrategy.name);
  private config: MomentumConfig;
  private priceHistory: number[] = [];
  
  constructor(
    public readonly id: string,
    public readonly symbol: string,
    private readonly broker: IBroker,
  ) {
    this.loadConfig();
    this.logger.log(`Initialized MomentumStrategy [${id}] for ${symbol}`);
  }

  private loadConfig() {
    try {
      const configPath = path.join(__dirname, 'momentum.yaml');
      const configFile = fs.readFileSync(configPath, 'utf8');
      this.config = yaml.load(configFile) as MomentumConfig;
      this.logger.log(`Loaded config: ${JSON.stringify(this.config)}`);
    } catch (error) {
      this.logger.error('Failed to load config, using defaults', error);
      this.config = {
        period: 14,
        rsiThreshold: 70,
        stopLoss: 2.0,
        takeProfit: 3.0,
        accountPercentage: 2.5
      };
    }
  }

  public async onTick(tick: Tick): Promise<void> {
    this.logger.debug(`[${this.id}] Received tick: ${tick.price}`);
    
    this.priceHistory.push(tick.price);
    
    // Keep only the last 'period + 1' prices for RSI calculation
    if (this.priceHistory.length > this.config.period + 1) {
      this.priceHistory.shift();
    }
    
    if (this.priceHistory.length < this.config.period + 1) {
      return;
    }
    
    const rsi = this.calculateRSI();
    const currentPrice = tick.price;
    const previousPrice = this.priceHistory[this.priceHistory.length - 2];
    const momentum = (currentPrice - previousPrice) / previousPrice * 100;
    
    try {
      // Momentum strategy with RSI confirmation
      if (momentum > 0.5 && rsi < (100 - this.config.rsiThreshold)) {
        // Positive momentum, not overbought - buy signal
        const quantity = this.calculatePositionSize(currentPrice);
        await this.broker.placeOrder({
          symbol: this.symbol,
          side: OrderSide.BUY,
          type: 'MARKET',
          quantity: quantity,
        });
        this.logger.log(`[${this.id}] Placed BUY order - momentum: ${momentum.toFixed(2)}%, RSI: ${rsi.toFixed(2)}`);
      } else if (momentum < -0.5 && rsi > this.config.rsiThreshold) {
        // Negative momentum, overbought - sell signal
        const quantity = this.calculatePositionSize(currentPrice);
        await this.broker.placeOrder({
          symbol: this.symbol,
          side: OrderSide.SELL,
          type: 'MARKET',
          quantity: quantity,
        });
        this.logger.log(`[${this.id}] Placed SELL order - momentum: ${momentum.toFixed(2)}%, RSI: ${rsi.toFixed(2)}`);
      }
    } catch (error) {
      this.logger.error(`[${this.id}] Error placing order`, error.message);
    }
  }
  
  private calculateRSI(): number {
    if (this.priceHistory.length < this.config.period + 1) {
      return 50; // Neutral RSI
    }
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < this.priceHistory.length; i++) {
      const change = this.priceHistory[i] - this.priceHistory[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    const avgGain = gains / this.config.period;
    const avgLoss = losses / this.config.period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  private calculatePositionSize(price: number): number {
    if (this.config.positionSize) {
      return this.config.positionSize;
    }
    
    const accountBalance = 100000; // Mock account balance
    const positionValue = accountBalance * (this.config.accountPercentage / 100);
    return Math.floor(positionValue / price);
  }
  
  public async onFill(order: Order): Promise<void> {
    this.logger.log(`[${this.id}] Order filled: ${JSON.stringify(order)}`);
  }
  
  public getConfig(): MomentumConfig {
    return this.config;
  }
  
  public updateConfig(newConfig: Partial<MomentumConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    this.logger.log(`[${this.id}] Config updated: ${JSON.stringify(this.config)}`);
  }
  
  private saveConfig(): void {
    try {
      const configPath = path.join(__dirname, 'momentum.yaml');
      const yamlStr = yaml.dump(this.config);
      fs.writeFileSync(configPath, yamlStr, 'utf8');
    } catch (error) {
      this.logger.error('Failed to save config', error);
    }
  }
}