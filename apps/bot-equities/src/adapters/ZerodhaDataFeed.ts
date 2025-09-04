import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { IDataFeed } from '../../../../packages/shared/src/interfaces';
import { Tick } from '../../../../types';

@Injectable()
export class ZerodhaDataFeed extends EventEmitter implements IDataFeed {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private accessToken: string;
  
  constructor() {
    super();
    this.apiKey = process.env.ZERODHA_API_KEY!;
    this.accessToken = process.env.ZERODHA_ACCESS_TOKEN!;
     if (!this.apiKey || !this.accessToken) {
        throw new Error('Zerodha API key and access token must be provided in environment variables.');
    }
  }
  
  async connect(): Promise<void> {
    const tickerUrl = `wss://ws.kite.trade?api_key=${this.apiKey}&access_token=${this.accessToken}`;
    this.ws = new WebSocket(tickerUrl);
    
    this.ws.on('open', () => {
      console.log('ZerodhaDataFeed WebSocket connected.');
      this.emit('connect');
    });
    
    this.ws.on('message', (data: WebSocket.Data) => {
      // Zerodha sends binary data which needs to be parsed.
      // This is a placeholder for the complex parsing logic.
      // We will log a message to indicate data is received.
      console.log('Received binary data from Zerodha WebSocket.');
    });

    this.ws.on('close', () => {
      console.log('ZerodhaDataFeed WebSocket disconnected.');
      this.emit('disconnect');
    });

    this.ws.on('error', (error) => {
      console.error('ZerodhaDataFeed WebSocket error:', error);
    });
  }

  async subscribe(symbols: string[]): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected.');
    }
    console.log(`Subscribing to Zerodha instruments: ${symbols.join(', ')}`);
    // Zerodha uses instrument tokens for subscription.
    // A real implementation would need a service to map symbols to tokens.
    const instrumentTokens = [256265]; // Placeholder token for NIFTY 50
    
    const subscriptionMessage = {
      a: 'subscribe',
      v: instrumentTokens,
    };
    this.ws.send(JSON.stringify(subscriptionMessage));

    // Also set mode to full to get all data points
    const modeMessage = {
        a: 'mode',
        v: ['full', instrumentTokens]
    }
    this.ws.send(JSON.stringify(modeMessage));
  }
}
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { IDataFeed } from '../../../../packages/shared/src/interfaces';
import { Candle } from '../../../../types';

@Injectable()
export class ZerodhaDataFeed implements IDataFeed {
  private readonly logger = new Logger(ZerodhaDataFeed.name);
  private apiClient: AxiosInstance;
  private apiKey: string;
  private accessToken: string;
  private subscribedSymbols = new Set<string>();

  constructor() {
    this.apiKey = process.env.ZERODHA_API_KEY!;
    this.accessToken = process.env.ZERODHA_ACCESS_TOKEN!;
    
    if (!this.apiKey || !this.accessToken) {
      throw new Error('Zerodha API key and access token must be provided');
    }

    this.apiClient = axios.create({
      baseURL: 'https://api.kite.trade',
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${this.apiKey}:${this.accessToken}`,
      },
    });
  }

  async connect(): Promise<void> {
    try {
      await this.apiClient.get('/user/profile');
      this.logger.log('Connected to Zerodha data feed');
    } catch (error) {
      this.logger.error('Failed to connect to Zerodha data feed:', error);
      throw new Error('Zerodha data feed connection failed');
    }
  }

  async subscribe(symbol: string, callback: (candle: Candle) => void): Promise<void> {
    if (this.subscribedSymbols.has(symbol)) {
      this.logger.warn(`Already subscribed to ${symbol}`);
      return;
    }

    try {
      // TODO: Implement WebSocket subscription for real-time data
      // For now, we'll use HTTP polling as placeholder
      this.subscribedSymbols.add(symbol);
      this.logger.log(`Subscribed to ${symbol} data feed (placeholder)`);
      
      // Start polling for this symbol
      this.startPolling(symbol, callback);
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${symbol}:`, error);
      throw error;
    }
  }

  async unsubscribe(symbol: string): Promise<void> {
    this.subscribedSymbols.delete(symbol);
    this.logger.log(`Unsubscribed from ${symbol} data feed`);
  }

  async getHistoricalData(symbol: string, from: Date, to: Date, interval: string): Promise<Candle[]> {
    try {
      // TODO: Map symbol to Zerodha instrument token
      const instrumentToken = this.getInstrumentToken(symbol);
      
      // TODO: Implement actual API call
      // const response = await this.apiClient.get(`/instruments/historical/${instrumentToken}/${interval}`, {
      //   params: { from: from.toISOString(), to: to.toISOString() }
      // });
      
      this.logger.log(`Fetching historical data for ${symbol} (placeholder)`);
      return []; // TODO: Return mapped candle data
    } catch (error) {
      this.logger.error(`Failed to fetch historical data for ${symbol}:`, error);
      throw error;
    }
  }

  private getInstrumentToken(symbol: string): string {
    // TODO: Implement symbol to instrument token mapping
    return '256265'; // Placeholder token
  }

  private startPolling(symbol: string, callback: (candle: Candle) => void): void {
    // TODO: Implement actual polling logic
    setInterval(() => {
      if (this.subscribedSymbols.has(symbol)) {
        // Generate placeholder candle data
        const mockCandle: Candle = {
          symbol,
          timestamp: new Date(),
          open: 100 + Math.random() * 10,
          high: 105 + Math.random() * 10,
          low: 95 + Math.random() * 10,
          close: 100 + Math.random() * 10,
          volume: Math.floor(Math.random() * 1000),
        };
        callback(mockCandle);
      }
    }, 5000); // Poll every 5 seconds
  }

  async disconnect(): Promise<void> {
    this.subscribedSymbols.clear();
    this.logger.log('Disconnected from Zerodha data feed');
  }
}
