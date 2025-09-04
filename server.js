const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');

// Initialize logging
console.log('🚀 Starting Chimera Trading Terminal with enhanced logging...');

const app = express();
const PORT = process.env.API_PORT || 3001;
const WS_PORT = parseInt(PORT) + 1;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5000', 
    'http://127.0.0.1:5000', 
    'https://*.replit.dev',
    `https://${process.env.REPLIT_DEV_DOMAIN}`
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Mock data
let orders = [];
let trades = [];
let positions = [
  {
    id: '1',
    symbol: 'RELIANCE',
    quantity: 50,
    avgPrice: 2400,
    currentPrice: 2450,
    pnl: 2500,
    dayChange: 25,
    dayChangePercent: 1.04,
    unrealizedPnl: 2500,
    botName: 'GridBot-RELIANCE'
  },
  {
    id: '2',
    symbol: 'TCS',
    quantity: 25,
    avgPrice: 3200,
    currentPrice: 3250,
    pnl: 1250,
    dayChange: 50,
    dayChangePercent: 1.56,
    unrealizedPnl: 1250,
    botName: 'MomentumBot-TCS'
  }
];

let portfolioStats = {
  totalValue: 125000,
  totalPnl: 5250.75,
  dayChange: 1875.40,
  dayChangePercent: 1.52,
  cashBalance: 45000,
  marginUsed: 80000
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'operational',
      websocket: 'operational'
    },
    version: '1.0.0'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    tradingMode: process.env.TRADING_MODE || 'paper',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/data/portfolio', (req, res) => {
  res.json({
    success: true,
    data: portfolioStats
  });
});

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: orders
  });
});

app.get('/api/orders/positions/all', (req, res) => {
  res.json({
    success: true,
    data: positions
  });
});

app.get('/api/orders/trades/all', (req, res) => {
  res.json({
    success: true,
    data: trades
  });
});

app.post('/api/orders', (req, res) => {
  const order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol: req.body.symbol,
    side: req.body.side,
    quantity: req.body.quantity,
    price: req.body.price || 0,
    status: 'PENDING',
    timestamp: new Date(),
    botName: 'Manual'
  };
  
  orders.push(order);
  
  // Simulate order filling after a delay
  setTimeout(() => {
    order.status = 'FILLED';
    
    // Create trade
    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price || (Math.random() * 1000 + 1000),
      pnl: 0,
      timestamp: new Date(),
      botName: order.botName,
      orderId: order.id
    };
    
    trades.push(trade);
    
    // Broadcast to WebSocket clients
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({
            type: 'order_update',
            data: order
          }));
          client.send(JSON.stringify({
            type: 'trade_created',
            data: trade
          }));
        }
      });
    }
  }, Math.random() * 3000 + 1000);
  
  res.status(201).json({
    success: true,
    data: order
  });
});

app.get('/api/data/historical/:symbol', (req, res) => {
  const { symbol } = req.params;
  const days = parseInt(req.query.days) || 30;
  const data = [];
  
  for (let i = days; i >= 0; i--) {
    const time = Date.now() - (i * 24 * 60 * 60 * 1000);
    const price = 1000 + Math.random() * 1000;
    data.push({ time, price });
  }
  
  res.json({
    success: true,
    data: { symbol, data }
  });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.send(JSON.stringify({
    type: 'connection',
    data: { message: 'Connected to Chimera Trading Terminal' }
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            requestId: message.requestId
          }));
          break;
          
        case 'get_positions':
          ws.send(JSON.stringify({
            type: 'positions',
            data: positions,
            requestId: message.requestId
          }));
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: `Unknown message type: ${message.type}` }
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Start server
server.listen(PORT, 'localhost', () => {
  console.log(`🚀 Chimera Trading Terminal API Server running on port ${PORT}`);
  console.log(`📈 Trading Mode: PAPER`);
  console.log(`🔌 WebSocket server running on port ${WS_PORT}`);
});

// Market data simulation
setInterval(() => {
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const price = 1000 + Math.random() * 2000;
  
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'tick',
        data: {
          symbol,
          price,
          timestamp: Date.now()
        }
      }));
    }
  });
}, 1000);

module.exports = { app, server };