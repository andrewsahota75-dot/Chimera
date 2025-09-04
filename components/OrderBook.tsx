
import React from 'react';

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export default function OrderBook() {
  // Mock data - replace with real WebSocket feed
  const bids: OrderBookEntry[] = [
    { price: 155.25, size: 100, total: 100 },
    { price: 155.20, size: 250, total: 350 },
    { price: 155.15, size: 150, total: 500 },
    { price: 155.10, size: 300, total: 800 },
    { price: 155.05, size: 200, total: 1000 }
  ];

  const asks: OrderBookEntry[] = [
    { price: 155.35, size: 150, total: 150 },
    { price: 155.40, size: 200, total: 350 },
    { price: 155.45, size: 100, total: 450 },
    { price: 155.50, size: 300, total: 750 },
    { price: 155.55, size: 250, total: 1000 }
  ];

  const maxTotal = Math.max(...bids.map(b => b.total), ...asks.map(a => a.total));

  return (
    <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Order Book</h3>
      
      <div className="space-y-2">
        {/* Asks */}
        <div className="space-y-1">
          {asks.reverse().map((ask, index) => (
            <div key={index} className="relative flex justify-between text-xs font-mono">
              <div 
                className="absolute left-0 top-0 h-full bg-[#e74c3c]/20 rounded"
                style={{ width: `${(ask.total / maxTotal) * 100}%` }}
              />
              <span className="relative z-10 text-[#e74c3c]">{ask.price.toFixed(2)}</span>
              <span className="relative z-10 text-gray-300">{ask.size}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="border-y border-gray-600 py-2 text-center">
          <span className="text-sm text-gray-400">
            Spread: ${(asks[0]?.price - bids[0]?.price || 0).toFixed(2)}
          </span>
        </div>

        {/* Bids */}
        <div className="space-y-1">
          {bids.map((bid, index) => (
            <div key={index} className="relative flex justify-between text-xs font-mono">
              <div 
                className="absolute left-0 top-0 h-full bg-[#2ecc71]/20 rounded"
                style={{ width: `${(bid.total / maxTotal) * 100}%` }}
              />
              <span className="relative z-10 text-[#2ecc71]">{bid.price.toFixed(2)}</span>
              <span className="relative z-10 text-gray-300">{bid.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
