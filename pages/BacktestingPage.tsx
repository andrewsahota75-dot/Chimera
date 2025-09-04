
import React, { useState } from 'react';
import { Play, BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

export default function BacktestingPage() {
  const [strategy, setStrategy] = useState('moving-average');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [initialCapital, setInitialCapital] = useState('100000');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Backtesting</h1>
        <button className="flex items-center space-x-2 bg-[#3bc9f4] text-white px-4 py-2 rounded-lg hover:bg-[#3bc9f4]/80 transition-colors">
          <Play className="w-4 h-4" />
          <span>Run Backtest</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-[#0e1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
              >
                <option value="moving-average">Moving Average Crossover</option>
                <option value="rsi">RSI Strategy</option>
                <option value="macd">MACD Strategy</option>
                <option value="bollinger">Bollinger Bands</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0e1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0e1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Initial Capital</label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full bg-[#0e1117] text-white px-3 py-2 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
                placeholder="100000"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Total Return', value: '+15.7%', icon: TrendingUp, color: 'text-[#2ecc71]' },
              { title: 'Sharpe Ratio', value: '1.42', icon: BarChart3, color: 'text-[#3bc9f4]' },
              { title: 'Max Drawdown', value: '-8.3%', icon: TrendingDown, color: 'text-[#e74c3c]' },
              { title: 'Win Rate', value: '67%', icon: Calendar, color: 'text-[#3bc9f4]' }
            ].map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="bg-[#1c1f26] p-4 rounded-lg border border-gray-700/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                    <span className="text-sm text-gray-400">{metric.title}</span>
                  </div>
                  <span className={`text-xl font-bold ${metric.color}`}>{metric.value}</span>
                </div>
              );
            })}
          </div>

          {/* Results Table */}
          <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50">
            <div className="p-4 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-white">Backtest Results</h3>
            </div>
            <div className="p-4">
              <div className="text-center text-gray-400 py-8">
                <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Run Backtest" to see results</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
