
import React, { useState } from 'react';
import { OrderSide, OrderType } from '../types';

export default function OrderEntry() {
  const [symbol, setSymbol] = useState('AAPL');
  const [side, setSide] = useState<OrderSide>('BUY');
  const [type, setType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState('100');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle order submission
    console.log('Order submitted:', { symbol, side, type, quantity, price });
  };

  return (
    <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Place Order</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full bg-[#0e1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
            placeholder="AAPL"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Side</label>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as OrderSide)}
              className="w-full bg-[#0e1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as OrderType)}
              className="w-full bg-[#0e1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
            >
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
              <option value="STOP">Stop</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-[#0e1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
            placeholder="100"
          />
        </div>

        {type === 'LIMIT' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-[#0e1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
              placeholder="0.00"
            />
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-2 px-4 rounded font-medium transition-colors ${
            side === 'BUY'
              ? 'bg-[#2ecc71] hover:bg-[#27ae60] text-white'
              : 'bg-[#e74c3c] hover:bg-[#c0392b] text-white'
          }`}
        >
          {side === 'BUY' ? 'Buy' : 'Sell'} {symbol}
        </button>
      </form>
    </div>
  );
}
