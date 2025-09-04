
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceData {
  time: string;
  price: number;
  volume: number;
}

const PriceChart: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [timeframe, setTimeframe] = useState('1D');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(2450.75);
  const [priceChange, setPriceChange] = useState(12.35);
  const [priceChangePercent, setPriceChangePercent] = useState(0.51);

  // Mock data generation
  useEffect(() => {
    const generateMockData = () => {
      const data: PriceData[] = [];
      let basePrice = 2400;
      const now = new Date();
      
      for (let i = 50; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
        basePrice += (Math.random() - 0.5) * 20;
        data.push({
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          price: parseFloat(basePrice.toFixed(2)),
          volume: Math.floor(Math.random() * 10000) + 5000
        });
      }
      return data;
    };

    setPriceData(generateMockData());
  }, [selectedSymbol, timeframe]);

  const symbols = ['RELIANCE', 'TCS', 'HDFC', 'INFY', 'ITC'];
  const timeframes = ['1D', '1W', '1M', '3M'];

  return (
    <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 overflow-hidden">
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-[#0e1117] text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3bc9f4]"
            >
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
            
            <div className="flex space-x-1">
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-[#3bc9f4] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#2a2e39]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-white font-mono">
              ₹{currentPrice.toFixed(2)}
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}</span>
              <span>({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Price']}
                contentStyle={{
                  backgroundColor: '#1c1f26',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3bc9f4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3bc9f4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Volume:</span>
              <span className="text-white font-mono">
                {priceData.length > 0 ? priceData[priceData.length - 1].volume.toLocaleString() : '0'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-gray-400">
            <span>High: ₹{Math.max(...priceData.map(d => d.price)).toFixed(2)}</span>
            <span>Low: ₹{Math.min(...priceData.map(d => d.price)).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
