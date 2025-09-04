import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import logger from './logger.js';
import cacheService from './cacheService.js';

const prisma = new PrismaClient();

export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleData extends OHLCV {
  symbol: string;
  timeframe: TimeFrame;
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface MarketDataSubscription {
  symbol: string;
  timeframes: TimeFrame[];
  callback: (data: CandleData) => void;
}

export class MarketDataManager extends EventEmitter {
  private static instance: MarketDataManager;
  private subscriptions: Map<string, MarketDataSubscription> = new Map();
  private candleBuffer: Map<string, OHLCV[]> = new Map(); // symbol -> tick data
  private lastCandles: Map<string, CandleData> = new Map(); // timeframe_symbol -> last candle
  private intervals: Map<TimeFrame, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    super();
    this.initializeTimeframes();
  }

  static getInstance(): MarketDataManager {
    if (!MarketDataManager.instance) {
      MarketDataManager.instance = new MarketDataManager();
    }
    return MarketDataManager.instance;
  }

  // Initialize timeframe processing intervals
  private initializeTimeframes(): void {
    const timeframeIntervals = {
      '1m': 60 * 1000,      // 1 minute
      '5m': 5 * 60 * 1000,   // 5 minutes  
      '15m': 15 * 60 * 1000, // 15 minutes
      '1h': 60 * 60 * 1000,  // 1 hour
      '4h': 4 * 60 * 60 * 1000, // 4 hours
      '1d': 24 * 60 * 60 * 1000 // 1 day
    };

    for (const [timeframe, intervalMs] of Object.entries(timeframeIntervals)) {
      const interval = setInterval(() => {
        this.processTimeframe(timeframe as TimeFrame);
      }, intervalMs);
      
      this.intervals.set(timeframe as TimeFrame, interval);
    }
  }

  // Start market data collection
  start(): void {
    if (this.isRunning) {
      logger.warn('Market data manager already running', 'MARKET_DATA', 'START');
      return;
    }

    this.isRunning = true;
    logger.info('Market data manager started', 'MARKET_DATA', 'START');
    this.emit('started');
  }

  // Stop market data collection
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear all intervals
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();

    logger.info('Market data manager stopped', 'MARKET_DATA', 'STOP');
    this.emit('stopped');
  }

  // Subscribe to market data for specific symbols and timeframes
  subscribe(subscription: MarketDataSubscription): string {
    const subscriptionId = `${subscription.symbol}_${Date.now()}`;
    this.subscriptions.set(subscriptionId, subscription);

    // Initialize candle buffer for this symbol
    if (!this.candleBuffer.has(subscription.symbol)) {
      this.candleBuffer.set(subscription.symbol, []);
    }

    logger.info('Market data subscription added', 'MARKET_DATA', 'SUBSCRIBE', {
      subscriptionId,
      symbol: subscription.symbol,
      timeframes: subscription.timeframes
    });

    return subscriptionId;
  }

  // Unsubscribe from market data
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      logger.info('Market data subscription removed', 'MARKET_DATA', 'UNSUBSCRIBE', { subscriptionId });
    }
    return removed;
  }

  // Add real-time tick data
  addTick(symbol: string, price: number, volume: number = 0): void {
    if (!this.isRunning) {
      return;
    }

    const tick: OHLCV = {
      timestamp: new Date(),
      open: price,
      high: price,
      low: price,
      close: price,
      volume
    };

    // Add to buffer
    let buffer = this.candleBuffer.get(symbol) || [];
    buffer.push(tick);
    
    // Keep only last 1000 ticks to prevent memory issues
    if (buffer.length > 1000) {
      buffer = buffer.slice(-1000);
    }
    
    this.candleBuffer.set(symbol, buffer);

    // Emit real-time tick event
    this.emit('tick', { symbol, price, volume, timestamp: tick.timestamp });
  }

  // Process timeframe and generate candles
  private async processTimeframe(timeframe: TimeFrame): Promise<void> {
    try {
      for (const [symbol, buffer] of this.candleBuffer.entries()) {
        if (buffer.length === 0) continue;

        const candle = this.generateCandle(symbol, timeframe, buffer);
        if (!candle) continue;

        // Cache the candle
        await this.cacheCandle(candle);

        // Store in database (for historical data)
        await this.storeCandle(candle);

        // Notify subscribers
        this.notifySubscribers(candle);

        // Update last candle tracking
        const key = `${timeframe}_${symbol}`;
        this.lastCandles.set(key, candle);
      }
    } catch (error) {
      logger.error('Error processing timeframe', 'MARKET_DATA', 'PROCESS_ERROR', {
        timeframe,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Generate OHLCV candle from tick data
  private generateCandle(symbol: string, timeframe: TimeFrame, buffer: OHLCV[]): CandleData | null {
    if (buffer.length === 0) {
      return null;
    }

    const now = new Date();
    const timeframeMs = this.getTimeframeMs(timeframe);
    const candleStart = new Date(Math.floor(now.getTime() / timeframeMs) * timeframeMs);

    // Filter ticks for this candle period
    const relevantTicks = buffer.filter(tick => {
      return tick.timestamp >= candleStart && tick.timestamp < new Date(candleStart.getTime() + timeframeMs);
    });

    if (relevantTicks.length === 0) {
      return null;
    }

    // Calculate OHLCV from ticks
    const open = relevantTicks[0].close;
    const close = relevantTicks[relevantTicks.length - 1].close;
    const high = Math.max(...relevantTicks.map(t => t.high));
    const low = Math.min(...relevantTicks.map(t => t.low));
    const volume = relevantTicks.reduce((sum, t) => sum + t.volume, 0);

    return {
      symbol,
      timeframe,
      timestamp: candleStart,
      open,
      high,
      low,
      close,
      volume
    };
  }

  // Cache candle data using the existing cache service
  private async cacheCandle(candle: CandleData): Promise<void> {
    try {
      const key = `candle:${candle.symbol}:${candle.timeframe}:${candle.timestamp.getTime()}`;
      await cacheService.set(key, candle, this.getCacheTTL(candle.timeframe));
    } catch (error) {
      logger.error('Error caching candle', 'MARKET_DATA', 'CACHE_ERROR', {
        symbol: candle.symbol,
        timeframe: candle.timeframe,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Store candle in database for historical data
  private async storeCandle(candle: CandleData): Promise<void> {
    try {
      // Store in a hypothetical candles table (would need to add to Prisma schema)
      // await prisma.candle.upsert({
      //   where: {
      //     symbol_timeframe_timestamp: {
      //       symbol: candle.symbol,
      //       timeframe: candle.timeframe,
      //       timestamp: candle.timestamp
      //     }
      //   },
      //   update: {
      //     open: candle.open,
      //     high: candle.high,
      //     low: candle.low,
      //     close: candle.close,
      //     volume: candle.volume
      //   },
      //   create: {
      //     symbol: candle.symbol,
      //     timeframe: candle.timeframe,
      //     timestamp: candle.timestamp,
      //     open: candle.open,
      //     high: candle.high,
      //     low: candle.low,
      //     close: candle.close,
      //     volume: candle.volume
      //   }
      // });

      logger.debug('Candle stored', 'MARKET_DATA', 'STORE', {
        symbol: candle.symbol,
        timeframe: candle.timeframe,
        timestamp: candle.timestamp
      });
    } catch (error) {
      logger.error('Error storing candle', 'MARKET_DATA', 'STORE_ERROR', {
        symbol: candle.symbol,
        timeframe: candle.timeframe,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Notify subscribers of new candle data
  private notifySubscribers(candle: CandleData): void {
    this.subscriptions.forEach((subscription, subscriptionId) => {
      if (subscription.symbol === candle.symbol && 
          subscription.timeframes.includes(candle.timeframe)) {
        try {
          subscription.callback(candle);
        } catch (error) {
          logger.error('Error in subscription callback', 'MARKET_DATA', 'CALLBACK_ERROR', {
            subscriptionId,
            symbol: candle.symbol,
            timeframe: candle.timeframe,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });

    // Emit general event
    this.emit('candle', candle);
  }

  // Get historical candle data
  async getHistoricalData(
    symbol: string, 
    timeframe: TimeFrame, 
    limit: number = 100
  ): Promise<CandleData[]> {
    try {
      // First try cache
      const cacheKey = `history:${symbol}:${timeframe}:${limit}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // In a real implementation, this would query the database
      // const candles = await prisma.candle.findMany({
      //   where: { symbol, timeframe },
      //   orderBy: { timestamp: 'desc' },
      //   take: limit
      // });

      // For now, return empty array
      const candles: CandleData[] = [];

      // Cache result
      await cacheService.set(cacheKey, candles, 300); // 5 minutes

      return candles;
    } catch (error) {
      logger.error('Error getting historical data', 'MARKET_DATA', 'HISTORY_ERROR', {
        symbol,
        timeframe,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  // Get latest candle for symbol and timeframe
  getLatestCandle(symbol: string, timeframe: TimeFrame): CandleData | null {
    const key = `${timeframe}_${symbol}`;
    return this.lastCandles.get(key) || null;
  }

  // Resample data from higher to lower timeframe
  resampleData(candles: CandleData[], fromTimeframe: TimeFrame, toTimeframe: TimeFrame): CandleData[] {
    if (candles.length === 0) return [];

    const fromMs = this.getTimeframeMs(fromTimeframe);
    const toMs = this.getTimeframeMs(toTimeframe);
    
    if (toMs <= fromMs) {
      // Cannot resample to higher frequency
      return candles;
    }

    const factor = toMs / fromMs;
    const resampled: CandleData[] = [];

    for (let i = 0; i < candles.length; i += factor) {
      const group = candles.slice(i, i + factor);
      if (group.length === 0) continue;

      const resampledCandle: CandleData = {
        symbol: group[0].symbol,
        timeframe: toTimeframe,
        timestamp: group[0].timestamp,
        open: group[0].open,
        high: Math.max(...group.map(c => c.high)),
        low: Math.min(...group.map(c => c.low)),
        close: group[group.length - 1].close,
        volume: group.reduce((sum, c) => sum + c.volume, 0)
      };

      resampled.push(resampledCandle);
    }

    return resampled;
  }

  // Utility methods
  private getTimeframeMs(timeframe: TimeFrame): number {
    const timeframeMap = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return timeframeMap[timeframe];
  }

  private getCacheTTL(timeframe: TimeFrame): number {
    // Cache TTL based on timeframe
    const ttlMap = {
      '1m': 60,        // 1 minute
      '5m': 300,       // 5 minutes
      '15m': 900,      // 15 minutes
      '1h': 3600,      // 1 hour
      '4h': 14400,     // 4 hours
      '1d': 86400      // 1 day
    };
    return ttlMap[timeframe];
  }

  // Get statistics
  getStats(): {
    isRunning: boolean;
    subscriptions: number;
    bufferedSymbols: number;
    totalTicks: number;
    totalCandles: number;
  } {
    const totalTicks = Array.from(this.candleBuffer.values())
      .reduce((sum, buffer) => sum + buffer.length, 0);

    return {
      isRunning: this.isRunning,
      subscriptions: this.subscriptions.size,
      bufferedSymbols: this.candleBuffer.size,
      totalTicks,
      totalCandles: this.lastCandles.size
    };
  }

  // Cleanup old data to prevent memory leaks
  cleanup(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    
    // Clean old ticks from buffer
    this.candleBuffer.forEach((buffer, symbol) => {
      const filtered = buffer.filter(tick => tick.timestamp > cutoff);
      this.candleBuffer.set(symbol, filtered);
    });

    // Clean old candles
    this.lastCandles.forEach((candle, key) => {
      if (candle.timestamp < cutoff) {
        this.lastCandles.delete(key);
      }
    });

    logger.info('Market data cleanup completed', 'MARKET_DATA', 'CLEANUP');
  }
}

export default MarketDataManager.getInstance();