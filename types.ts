
export interface Position {
  id?: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  dayChange: number;
  dayChangePercent: number;
  unrealizedPnl: number;
  miniChart?: Array<{ time: number; price: number }>;
  logo?: string;
  botName?: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  timestamp: Date;
  botName?: string;
  brokerOrderId?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  pnl: number;
  timestamp: Date;
  botName: string;
  orderId?: string;
}

export interface BotStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  pnl: number;
  strategy: {
    name: string;
    symbol: string;
  };
  lastUpdate: Date;
}

export interface PortfolioStats {
  totalValue: number;
  totalPnl: number;
  dayChange: number;
  dayChangePercent: number;
  cashBalance: number;
  marginUsed: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: Date;
}

export interface StrategyConfig {
  id: string;
  name: string;
  symbol: string;
  parameters: Record<string, any>;
  isActive: boolean;
  botName: string;
}

export interface BacktestResult {
  id: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  equityCurve: Array<{ time: number; equity: number }>;
}

export interface AlertMessage {
  id: string;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  service: string;
  timestamp: Date;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: Date;
}

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
