
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, Building2 } from 'lucide-react';

interface Position {
  symbol: string;
  company: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  logo?: string;
  miniChart?: number[];
}

type SortField = 'symbol' | 'quantity' | 'unrealizedPnl' | 'dayChange';
type SortDirection = 'asc' | 'desc';

export default function PositionsTable() {
  const [sortField, setSortField] = useState<SortField>('unrealizedPnl');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Mock data - replace with real data
  const [positions] = useState<Position[]>([
    {
      symbol: 'AAPL',
      company: 'Apple Inc.',
      quantity: 100,
      avgPrice: 150.25,
      currentPrice: 155.30,
      unrealizedPnl: 505.00,
      unrealizedPnlPercent: 3.36,
      dayChange: 2.10,
      dayChangePercent: 1.37,
      miniChart: [148, 150, 152, 151, 153, 155, 155.30]
    },
    {
      symbol: 'GOOGL',
      company: 'Alphabet Inc.',
      quantity: 50,
      avgPrice: 2750.00,
      currentPrice: 2680.50,
      unrealizedPnl: -3475.00,
      unrealizedPnlPercent: -2.53,
      dayChange: -15.25,
      dayChangePercent: -0.57,
      miniChart: [2695, 2690, 2685, 2680, 2678, 2682, 2680.50]
    },
    {
      symbol: 'MSFT',
      company: 'Microsoft Corporation',
      quantity: 75,
      avgPrice: 300.00,
      currentPrice: 315.75,
      unrealizedPnl: 1181.25,
      unrealizedPnlPercent: 5.25,
      dayChange: 4.50,
      dayChangePercent: 1.45,
      miniChart: [310, 312, 314, 313, 315, 316, 315.75]
    }
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPositions = [...positions].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return (a[sortField] < b[sortField] ? -1 : 1) * modifier;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
      </div>
    </th>
  );

  const MiniChart = ({ data }: { data: number[] }) => (
    <div className="w-12 h-6">
      <svg className="w-full h-full" viewBox="0 0 48 24">
        <polyline
          points={data
            .map((val, i) => `${(i * 48) / (data.length - 1)},${24 - ((val - Math.min(...data)) / (Math.max(...data) - Math.min(...data)) * 20)}`)
            .join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="opacity-60"
        />
      </svg>
    </div>
  );

  return (
    <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 overflow-hidden">
      <div className="p-4 border-b border-gray-700/50">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-[#3bc9f4]" />
          <span>Positions</span>
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0e1117]">
            <tr>
              <SortableHeader field="symbol">Symbol</SortableHeader>
              <SortableHeader field="quantity">Quantity</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Avg Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Current
              </th>
              <SortableHeader field="unrealizedPnl">P&L</SortableHeader>
              <SortableHeader field="dayChange">Day Change</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Chart
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {sortedPositions.map((position, index) => (
              <tr 
                key={position.symbol}
                className={`hover:bg-gray-700/30 transition-colors ${
                  position.unrealizedPnl >= 0 ? 'bg-[#2ecc71]/5' : 'bg-[#e74c3c]/5'
                }`}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#3bc9f4]/20 rounded-full flex items-center justify-center">
                      <span className="text-[#3bc9f4] text-xs font-bold">
                        {position.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-mono font-semibold text-white">
                        {position.symbol}
                      </div>
                      <div className="text-xs text-gray-400">
                        {position.company}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-white">
                  {position.quantity.toLocaleString()}
                </td>
                <td className="px-4 py-4 font-mono text-gray-300">
                  ${position.avgPrice.toFixed(2)}
                </td>
                <td className="px-4 py-4 font-mono text-white">
                  ${position.currentPrice.toFixed(2)}
                </td>
                <td className="px-4 py-4">
                  <div className="text-right">
                    <div className={`font-mono font-semibold ${
                      position.unrealizedPnl >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                    }`}>
                      {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
                    </div>
                    <div className={`text-xs ${
                      position.unrealizedPnlPercent >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                    }`}>
                      {position.unrealizedPnlPercent >= 0 ? '+' : ''}{position.unrealizedPnlPercent.toFixed(2)}%
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-right">
                    <div className={`font-mono font-semibold flex items-center justify-end space-x-1 ${
                      position.dayChange >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                    }`}>
                      {position.dayChange >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {position.dayChange >= 0 ? '+' : ''}${position.dayChange.toFixed(2)}
                      </span>
                    </div>
                    <div className={`text-xs ${
                      position.dayChangePercent >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                    }`}>
                      {position.dayChangePercent >= 0 ? '+' : ''}{position.dayChangePercent.toFixed(2)}%
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className={position.dayChange >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}>
                    <MiniChart data={position.miniChart || []} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
