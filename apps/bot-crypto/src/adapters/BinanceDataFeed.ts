
import { IDataFeed } from '../../../../packages/shared/src/interfaces';
import { MarketData } from '../../../../types';

export class BinanceDataFeed implements IDataFeed {
  private websocket: WebSocket | null = null;
  private subscribers: Map<string, (data: MarketData) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    try {
      const wsUrl = process.env.TRADING_MODE === 'live' 
        ? 'wss://stream.binance.com:9443/ws/stream'
        : 'wss://testnet.binance.vision/ws/stream';

      console.log('Connecting to Binance WebSocket...');
      
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('Connected to Binance WebSocket');
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('Binance WebSocket connection closed');
        this.attemptReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('Binance WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to Binance WebSocket:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.subscribers.clear();
    console.log('Disconnected from Binance WebSocket');
  }

  async subscribe(symbol: string, callback: (data: MarketData) => void): Promise<void> {
    this.subscribers.set(symbol, callback);
    
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        method: 'SUBSCRIBE',
        params: [`${symbol.toLowerCase()}@ticker`],
        id: Date.now()
      };
      
      this.websocket.send(JSON.stringify(subscribeMessage));
      console.log(`Subscribed to ${symbol} on Binance`);
    }
  }

  async unsubscribe(symbol: string): Promise<void> {
    if (this.subscribers.has(symbol)) {
      this.subscribers.delete(symbol);
      
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const unsubscribeMessage = {
          method: 'UNSUBSCRIBE',
          params: [`${symbol.toLowerCase()}@ticker`],
          id: Date.now()
        };
        
        this.websocket.send(JSON.stringify(unsubscribeMessage));
        console.log(`Unsubscribed from ${symbol} on Binance`);
      }
    }
  }

  async getHistoricalData(symbol: string, interval: string, limit: number): Promise<any[]> {
    try {
      const baseUrl = process.env.TRADING_MODE === 'live' 
        ? 'https://api.binance.com/api'
        : 'https://testnet.binance.vision/api';
      
      const url = `${baseUrl}/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch historical data: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.map((kline: any[]) => ({
        timestamp: new Date(kline[0]),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
    } catch (error) {
      console.error('Failed to get historical data from Binance:', error);
      return [];
    }
  }

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  private handleMessage(data: any): void {
    if (data.stream && data.data) {
      const tickerData = data.data;
      const symbol = tickerData.s;
      
      if (this.subscribers.has(symbol)) {
        const marketData: MarketData = {
          symbol,
          price: parseFloat(tickerData.c),
          change: parseFloat(tickerData.P),
          changePercent: parseFloat(tickerData.P),
          volume: parseFloat(tickerData.v),
          high: parseFloat(tickerData.h),
          low: parseFloat(tickerData.l),
          timestamp: new Date()
        };
        
        const callback = this.subscribers.get(symbol);
        if (callback) {
          callback(marketData);
        }
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Attempting to reconnect to Binance WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection attempt failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached for Binance WebSocket');
    }
  }
}
