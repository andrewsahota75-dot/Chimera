
import { create } from 'zustand';
import { BotStatus, Position, Order, Trade, PortfolioStats } from '../../../../types';

interface BotStore {
  // State
  bots: BotStatus[];
  activeBots: string[];
  positions: Position[];
  orders: Order[];
  trades: Trade[];
  portfolioStats: PortfolioStats;
  isConnected: boolean;
  lastUpdate: Date;
  tradingMode: 'live' | 'paper';
  
  // Actions
  setBots: (bots: BotStatus[]) => void;
  updateBotStatus: (botName: string, status: 'running' | 'stopped' | 'error') => void;
  startBot: (botName: string) => void;
  stopBot: (botName: string) => void;
  setPositions: (positions: Position[]) => void;
  updatePosition: (symbol: string, updates: Partial<Position>) => void;
  addPosition: (position: Position) => void;
  removePosition: (symbol: string) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  setTrades: (trades: Trade[]) => void;
  addTrade: (trade: Trade) => void;
  updatePortfolioStats: (stats: Partial<PortfolioStats>) => void;
  setConnectionStatus: (connected: boolean) => void;
  setTradingMode: (mode: 'live' | 'paper') => void;
  reset: () => void;
}

export const useBotStore = create<BotStore>((set, get) => ({
  // Initial state
  bots: [
    {
      name: 'Equity-Bot-1',
      status: 'running',
      pnl: 2450.50,
      strategy: {
        name: 'Mean Reversion',
        symbol: 'RELIANCE'
      },
      lastUpdate: new Date()
    },
    {
      name: 'Crypto-Bot-1',
      status: 'stopped',
      pnl: -150.25,
      strategy: {
        name: 'Momentum',
        symbol: 'BTCUSDT'
      },
      lastUpdate: new Date()
    }
  ],
  
  activeBots: ['Equity-Bot-1'],
  
  positions: [
    {
      id: '1',
      symbol: 'RELIANCE',
      quantity: 100,
      avgPrice: 2400.00,
      currentPrice: 2450.50,
      pnl: 5050.00,
      dayChange: 25.50,
      dayChangePercent: 1.05,
      unrealizedPnl: 5050.00,
      logo: '',
      botName: 'Equity-Bot-1'
    },
    {
      id: '2',
      symbol: 'TCS',
      quantity: 50,
      avgPrice: 3500.00,
      currentPrice: 3480.00,
      pnl: -1000.00,
      dayChange: -20.00,
      dayChangePercent: -0.57,
      unrealizedPnl: -1000.00,
      logo: '',
      botName: 'Equity-Bot-1'
    }
  ],
  
  orders: [
    {
      id: '1',
      symbol: 'HDFC',
      side: 'BUY',
      quantity: 25,
      price: 1650.00,
      status: 'PENDING',
      timestamp: new Date(),
      botName: 'Equity-Bot-1'
    }
  ],
  
  trades: [
    {
      id: '1',
      symbol: 'RELIANCE',
      side: 'BUY',
      quantity: 100,
      price: 2450.50,
      pnl: 0,
      timestamp: new Date(Date.now() - 3600000),
      botName: 'Equity-Bot-1'
    }
  ],
  
  portfolioStats: {
    totalValue: 125430.50,
    totalPnl: 25430.50,
    dayChange: 1250.75,
    dayChangePercent: 2.15,
    cashBalance: 45000.00,
    marginUsed: 15000.00
  },
  
  isConnected: true,
  lastUpdate: new Date(),
  tradingMode: 'paper',
  
  // Actions
  setBots: (bots) => set({ bots, lastUpdate: new Date() }),
  
  updateBotStatus: (botName, status) => set((state) => ({
    bots: state.bots.map(bot => 
      bot.name === botName 
        ? { ...bot, status, lastUpdate: new Date() }
        : bot
    ),
    lastUpdate: new Date()
  })),
  
  startBot: (botName) => set((state) => ({
    activeBots: [...state.activeBots.filter(name => name !== botName), botName],
    bots: state.bots.map(bot => 
      bot.name === botName 
        ? { ...bot, status: 'running' as const, lastUpdate: new Date() }
        : bot
    ),
    lastUpdate: new Date()
  })),
  
  stopBot: (botName) => set((state) => ({
    activeBots: state.activeBots.filter(name => name !== botName),
    bots: state.bots.map(bot => 
      bot.name === botName 
        ? { ...bot, status: 'stopped' as const, lastUpdate: new Date() }
        : bot
    ),
    lastUpdate: new Date()
  })),
  
  setPositions: (positions) => set({ positions, lastUpdate: new Date() }),
  
  updatePosition: (symbol, updates) => set((state) => ({
    positions: state.positions.map(pos => 
      pos.symbol === symbol ? { ...pos, ...updates } : pos
    ),
    lastUpdate: new Date()
  })),

  addPosition: (position) => set((state) => ({
    positions: [...state.positions, position],
    lastUpdate: new Date()
  })),

  removePosition: (symbol) => set((state) => ({
    positions: state.positions.filter(pos => pos.symbol !== symbol),
    lastUpdate: new Date()
  })),
  
  setOrders: (orders) => set({ orders, lastUpdate: new Date() }),
  
  addOrder: (order) => set((state) => ({
    orders: [...state.orders, order],
    lastUpdate: new Date()
  })),

  updateOrder: (orderId, updates) => set((state) => ({
    orders: state.orders.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ),
    lastUpdate: new Date()
  })),
  
  setTrades: (trades) => set({ trades, lastUpdate: new Date() }),
  
  addTrade: (trade) => set((state) => ({
    trades: [...state.trades, trade],
    lastUpdate: new Date()
  })),
  
  updatePortfolioStats: (stats) => set((state) => ({
    portfolioStats: { ...state.portfolioStats, ...stats },
    lastUpdate: new Date()
  })),
  
  setConnectionStatus: (connected) => set({ 
    isConnected: connected, 
    lastUpdate: new Date() 
  }),

  setTradingMode: (mode) => set({ 
    tradingMode: mode, 
    lastUpdate: new Date() 
  }),
  
  reset: () => set({
    bots: [],
    activeBots: [],
    positions: [],
    orders: [],
    trades: [],
    portfolioStats: {
      totalValue: 0,
      totalPnl: 0,
      dayChange: 0,
      dayChangePercent: 0,
      cashBalance: 0,
      marginUsed: 0
    },
    isConnected: false,
    tradingMode: 'paper',
    lastUpdate: new Date()
  })
}));
