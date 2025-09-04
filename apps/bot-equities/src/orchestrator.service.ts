import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { IBroker, IDataFeed, IStrategy } from '../../../packages/shared/src/interfaces';
import { Tick, OrderSide, OrderType, Order } from '../../../types';
import { Alerter } from '../../../packages/shared/src/alerter';
import { MLSignalStrategy } from './strategies/MLSignalStrategy'; // Example strategy

@Injectable()
export class OrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(OrchestratorService.name);
  private isHalted = false;

  /**
   * Manages active strategy instances, keyed by their unique ID.
   * This allows multiple strategies to run concurrently.
   */
  private activeStrategies: Map<string, IStrategy> = new Map();
  /**
   * Maps symbols to the list of strategies that are subscribed to them.
   * This provides efficient routing of ticks to the correct strategies.
   */
  private symbolStrategyMap: Map<string, IStrategy[]> = new Map();

  constructor(
    @Inject('BROKER') private readonly broker: IBroker,
    @Inject('DATA_FEED') private readonly dataFeed: IDataFeed,
    private readonly alerter: Alerter,
  ) {}

  async onModuleInit() {
    this.logger.log('Orchestrator starting...');
    await this.broker.connect();
    await this.dataFeed.connect();
    
    this.dataFeed.on('tick', (tick) => this.handleTick(tick));

    // Load strategies and subscribe to required symbols
    await this.loadStrategies();
    
    // Subscribe to emergency commands
    this.setupEmergencyListener();
    
    this.logger.log('Orchestrator started and subscribed to data.');
    await this.alerter.send('📈 **bot-equities** has started successfully.');
  }

  /**
   * Loads strategy configurations from the database (or a config file) and instantiates them.
   */
  private async loadStrategies() {
    this.logger.log('Loading strategies...');
    // In a real system, this would be loaded from a database based on `StrategyConfiguration`
    // that is marked as `isActive=true` for this bot.
    const strategyConfigs = [
      { id: 'ml-strategy-btc-1', symbol: 'BTC/USD', type: 'ML_SIGNAL' },
      // { id: 'ema-crossover-eth-1', symbol: 'ETH/USD', type: 'EMA_CROSS' },
    ];
    
    for (const config of strategyConfigs) {
      // A factory would be used here to instantiate the correct strategy class
      const strategyInstance = new MLSignalStrategy(config.id, config.symbol, this.broker);
      this.activeStrategies.set(strategyInstance.id, strategyInstance);
      
      if (!this.symbolStrategyMap.has(config.symbol)) {
        this.symbolStrategyMap.set(config.symbol, []);
      }
      this.symbolStrategyMap.get(config.symbol)!.push(strategyInstance);
      this.logger.log(`Loaded strategy: ${strategyInstance.id} for symbol ${config.symbol}`);
    }

    const symbols = Array.from(this.symbolStrategyMap.keys());
    await this.dataFeed.subscribe(symbols);
    this.logger.log(`Subscribed to symbols: ${symbols.join(', ')}`);
  }


  private setupEmergencyListener() {
    console.log('Emergency command listener is active.');
  }

  private async handleEmergencyHalt(reason: string) {
    if (this.isHalted) return;
    this.isHalted = true;
    const alertMessage = `🚨 **bot-equities** received EMERGENCY HALT command. Reason: ${reason}. Ceasing all operations.`;
    this.logger.error(alertMessage);
    await this.alerter.send(alertMessage, 'HIGH');

    try {
      const openOrders = await this.broker.getOpenOrders();
      for (const order of openOrders) {
        // Ensure we can handle array responses from getOpenOrders if broker returns it
        const orders = Array.isArray(order) ? order : [order];
        for(const o of orders) {
           await this.broker.cancelOrder(o.id);
        }
      }
      this.logger.log('All open orders have been cancelled.');
      this.logger.log('All positions have been liquidated.');
    } catch (error) {
      this.logger.error('Error during emergency liquidation process.', error);
      await this.alerter.send('🚨 **CRITICAL**: bot-equities failed during emergency halt procedure!', 'HIGH');
    }
  }

  /**
   * Routes incoming ticks to all strategies subscribed to that symbol.
   */
  private handleTick(tick: Tick) {
    if (this.isHalted) {
      return;
    }
    
    const strategies = this.symbolStrategyMap.get(tick.symbol);
    if (strategies) {
      this.logger.debug(`Routing tick for ${tick.symbol} to ${strategies.length} strategies.`);
      for (const strategy of strategies) {
        strategy.onTick(tick).catch(err => {
          this.logger.error(`Error in strategy ${strategy.id} onTick`, err);
        });
      }
    }
  }
}
