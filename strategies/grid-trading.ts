import { IStrategy, IBroker, Tick, Order, OrderSide } from '../packages/shared/src/interfaces';
import { Logger } from '@nestjs/common';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface GridTradingConfig {
  gridSpacing: number;
  gridLevels: number;
  orderSize: number;
  basePrice: number;
  positionSize?: number;
  accountPercentage: number;
}

export class GridTradingStrategy implements IStrategy {
  private readonly logger = new Logger(GridTradingStrategy.name);
  private config: GridTradingConfig;
  private gridOrders: Map<number, string> = new Map(); // price -> orderId
  
  constructor(
    public readonly id: string,
    public readonly symbol: string,
    private readonly broker: IBroker,
  ) {
    this.loadConfig();
    this.logger.log(`Initialized GridTradingStrategy [${id}] for ${symbol}`);
  }

  private loadConfig() {
    try {
      const configPath = path.join(__dirname, 'grid-trading.yaml');
      const configFile = fs.readFileSync(configPath, 'utf8');
      this.config = yaml.load(configFile) as GridTradingConfig;
      this.logger.log(`Loaded config: ${JSON.stringify(this.config)}`);
    } catch (error) {
      this.logger.error('Failed to load config, using defaults', error);
      this.config = {
        gridSpacing: 0.005,
        gridLevels: 10,
        orderSize: 0.01,
        basePrice: 43000,
        accountPercentage: 5.0
      };
    }
  }

  public async onTick(tick: Tick): Promise<void> {
    this.logger.debug(`[${this.id}] Received tick: ${tick.price}`);
    
    // Initialize grid if not set up
    if (this.gridOrders.size === 0) {
      await this.setupGrid(tick.price);
    }
    
    // Check if we need to adjust grid based on price movement
    await this.maintainGrid(tick.price);
  }
  
  private async setupGrid(currentPrice: number): Promise<void> {
    const basePrice = this.config.basePrice || currentPrice;
    const halfLevels = Math.floor(this.config.gridLevels / 2);
    
    try {
      // Place buy orders below current price
      for (let i = 1; i <= halfLevels; i++) {
        const price = basePrice * (1 - this.config.gridSpacing * i);
        const quantity = this.calculatePositionSize(price);
        
        const order = await this.broker.placeOrder({
          symbol: this.symbol,
          side: OrderSide.BUY,
          type: 'LIMIT',
          quantity: quantity,
          price: price,
        });
        
        this.gridOrders.set(price, order.id);
      }
      
      // Place sell orders above current price
      for (let i = 1; i <= halfLevels; i++) {
        const price = basePrice * (1 + this.config.gridSpacing * i);
        const quantity = this.calculatePositionSize(price);
        
        const order = await this.broker.placeOrder({
          symbol: this.symbol,
          side: OrderSide.SELL,
          type: 'LIMIT',
          quantity: quantity,
          price: price,
        });
        
        this.gridOrders.set(price, order.id);
      }
      
      this.logger.log(`[${this.id}] Grid setup complete with ${this.gridOrders.size} orders`);
    } catch (error) {
      this.logger.error(`[${this.id}] Error setting up grid`, error.message);
    }
  }
  
  private async maintainGrid(currentPrice: number): Promise<void> {
    // Logic to maintain grid - replace filled orders
    // This is a simplified version
  }
  
  private calculatePositionSize(price: number): number {
    if (this.config.positionSize) {
      return this.config.positionSize;
    }
    
    // For grid trading, use config.orderSize or percentage-based sizing
    if (this.config.orderSize) {
      return this.config.orderSize;
    }
    
    const accountBalance = 100000; // Mock account balance
    const positionValue = accountBalance * (this.config.accountPercentage / 100) / this.config.gridLevels;
    return Math.floor(positionValue / price);
  }
  
  public async onFill(order: Order): Promise<void> {
    this.logger.log(`[${this.id}] Grid order filled: ${JSON.stringify(order)}`);
    
    // Remove filled order from grid
    for (const [price, orderId] of this.gridOrders.entries()) {
      if (orderId === order.id) {
        this.gridOrders.delete(price);
        break;
      }
    }
    
    // Place new order on opposite side
    await this.replaceFilledOrder(order);
  }
  
  private async replaceFilledOrder(filledOrder: Order): Promise<void> {
    try {
      const oppositeSide = filledOrder.side === OrderSide.BUY ? OrderSide.SELL : OrderSide.BUY;
      const newPrice = filledOrder.side === OrderSide.BUY 
        ? filledOrder.price * (1 + this.config.gridSpacing)
        : filledOrder.price * (1 - this.config.gridSpacing);
      
      const quantity = this.calculatePositionSize(newPrice);
      
      const newOrder = await this.broker.placeOrder({
        symbol: this.symbol,
        side: oppositeSide,
        type: 'LIMIT',
        quantity: quantity,
        price: newPrice,
      });
      
      this.gridOrders.set(newPrice, newOrder.id);
      this.logger.log(`[${this.id}] Replaced filled order with new ${oppositeSide} order at ${newPrice}`);
    } catch (error) {
      this.logger.error(`[${this.id}] Error replacing filled order`, error.message);
    }
  }
  
  public getConfig(): GridTradingConfig {
    return this.config;
  }
  
  public updateConfig(newConfig: Partial<GridTradingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    this.logger.log(`[${this.id}] Config updated: ${JSON.stringify(this.config)}`);
  }
  
  private saveConfig(): void {
    try {
      const configPath = path.join(__dirname, 'grid-trading.yaml');
      const yamlStr = yaml.dump(this.config);
      fs.writeFileSync(configPath, yamlStr, 'utf8');
    } catch (error) {
      this.logger.error('Failed to save config', error);
    }
  }
}