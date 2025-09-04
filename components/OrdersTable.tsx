
import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '../types';

export default function OrdersTable() {
  const [orders] = useState<Order[]>([
    {
      id: '1',
      symbol: 'AAPL',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 100,
      price: 150.00,
      status: 'PENDING',
      timestamp: new Date(),
      filledQuantity: 0
    },
    {
      id: '2',
      symbol: 'GOOGL',
      side: 'SELL',
      type: 'MARKET',
      quantity: 50,
      status: 'FILLED',
      timestamp: new Date(Date.now() - 300000),
      filledQuantity: 50,
      avgFillPrice: 2685.50
    }
  ]);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'FILLED':
        return <CheckCircle className="w-4 h-4 text-[#2ecc71]" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'REJECTED':
        return <AlertCircle className="w-4 h-4 text-[#e74c3c]" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Side
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className="text-sm text-white">{order.status}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-white">{order.symbol}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-sm font-medium ${
                    order.side === 'BUY' ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                  }`}>
                    {order.side}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-300">{order.type}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-mono text-white">
                    {order.filledQuantity}/{order.quantity}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-mono text-white">
                    ${order.avgFillPrice || order.price || '-'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-400">
                    {order.timestamp.toLocaleTimeString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
