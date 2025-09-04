import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const dailyPerformanceData = [
  { date: '2024-01-01', pnl: 1250.50, trades: 8, winRate: 75 },
  { date: '2024-01-02', pnl: -320.25, trades: 5, winRate: 40 },
  { date: '2024-01-03', pnl: 890.75, trades: 12, winRate: 67 },
  { date: '2024-01-04', pnl: 2100.30, trades: 15, winRate: 80 },
  { date: '2024-01-05', pnl: -150.45, trades: 6, winRate: 33 },
  { date: '2024-01-08', pnl: 1750.60, trades: 10, winRate: 70 },
  { date: '2024-01-09', pnl: 420.85, trades: 7, winRate: 57 },
  { date: '2024-01-10', pnl: -680.15, trades: 9, winRate: 44 },
  { date: '2024-01-11', pnl: 1320.40, trades: 11, winRate: 73 },
  { date: '2024-01-12', pnl: 590.25, trades: 8, winRate: 63 },
  { date: '2024-01-15', pnl: -245.80, trades: 4, winRate: 25 },
  { date: '2024-01-16', pnl: 980.45, trades: 9, winRate: 67 },
  { date: '2024-01-17', pnl: 1450.90, trades: 13, winRate: 77 },
  { date: '2024-01-18', pnl: -110.30, trades: 5, winRate: 20 },
  { date: '2024-01-19', pnl: 760.55, trades: 8, winRate: 75 }
];

export default function DailyPerformanceView() {
  const totalPnl = dailyPerformanceData.reduce((sum, day) => sum + day.pnl, 0);
  const profitableDays = dailyPerformanceData.filter(day => day.pnl > 0).length;
  const totalDays = dailyPerformanceData.length;
  const winRateDaily = (profitableDays / totalDays) * 100;
  const avgDailyPnl = totalPnl / totalDays;
  const bestDay = dailyPerformanceData.reduce((max, day) => day.pnl > max.pnl ? day : max);
  const worstDay = dailyPerformanceData.reduce((min, day) => day.pnl < min.pnl ? day : min);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1c1f26] border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className={`text-sm ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            P&L: {data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}
          </p>
          <p className="text-gray-300 text-sm">Trades: {data.trades}</p>
          <p className="text-gray-300 text-sm">Win Rate: {data.winRate}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Daily Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-[#3bc9f4]/20 rounded-lg">
              <Calendar className="w-5 h-5 text-[#3bc9f4]" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Daily Win Rate</p>
            <p className="text-2xl font-bold text-white mb-1 font-mono">{winRateDaily.toFixed(1)}%</p>
            <p className="text-sm text-gray-400">{profitableDays}/{totalDays} profitable days</p>
          </div>
        </div>

        <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-[#2ecc71]/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#2ecc71]" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Avg Daily P&L</p>
            <p className={`text-2xl font-bold mb-1 font-mono ${avgDailyPnl >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`}>
              {avgDailyPnl >= 0 ? '+' : ''}${avgDailyPnl.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400">Per trading day</p>
          </div>
        </div>

        <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-[#2ecc71]/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#2ecc71]" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Best Day</p>
            <p className="text-2xl font-bold text-[#2ecc71] mb-1 font-mono">+${bestDay.pnl.toFixed(2)}</p>
            <p className="text-sm text-gray-400">{new Date(bestDay.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-[#e74c3c]/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-[#e74c3c]" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Worst Day</p>
            <p className="text-2xl font-bold text-[#e74c3c] mb-1 font-mono">${worstDay.pnl.toFixed(2)}</p>
            <p className="text-sm text-gray-400">{new Date(worstDay.date).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Daily P&L Chart */}
      <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Daily P&L Performance</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="pnl" 
                fill={(entry: any) => entry.pnl >= 0 ? '#2ecc71' : '#e74c3c'}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Performance Table */}
      <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Daily Performance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0e1117]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Trades</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {dailyPerformanceData.slice().reverse().map((day, index) => (
                <tr key={index} className="hover:bg-[#0e1117]/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white">{new Date(day.date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-mono ${day.pnl >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`}>
                      {day.pnl >= 0 ? '+' : ''}${day.pnl.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white font-mono">{day.trades}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white font-mono">{day.winRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}