
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react';

export default function PortfolioOverviewPage() {
  // Mock data
  const allocationData = [
    { name: 'Technology', value: 45, color: '#3bc9f4' },
    { name: 'Healthcare', value: 25, color: '#2ecc71' },
    { name: 'Finance', value: 20, color: '#e74c3c' },
    { name: 'Consumer', value: 10, color: '#f39c12' }
  ];

  const performanceData = [
    { month: 'Jan', portfolio: 5.2, benchmark: 3.1 },
    { month: 'Feb', portfolio: -2.1, benchmark: -1.5 },
    { month: 'Mar', portfolio: 8.7, benchmark: 6.2 },
    { month: 'Apr', portfolio: 3.4, benchmark: 2.8 },
    { month: 'May', portfolio: -1.2, benchmark: 0.5 },
    { month: 'Jun', portfolio: 6.8, benchmark: 4.3 }
  ];

  const metrics = [
    { title: 'Total Value', value: '$124,567.89', change: '+2.34%', icon: DollarSign, changeType: 'positive' },
    { title: 'Total Return', value: '+15.7%', change: 'vs 12.3% benchmark', icon: TrendingUp, changeType: 'positive' },
    { title: 'Annual Volatility', value: '18.2%', change: 'vs 22.1% benchmark', icon: Target, changeType: 'positive' },
    { title: 'Sharpe Ratio', value: '1.42', change: 'vs 1.15 benchmark', icon: Percent, changeType: 'positive' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Portfolio Overview</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-[#3bc9f4]/20 rounded-lg">
                  <Icon className="w-5 h-5 text-[#3bc9f4]" />
                </div>
                <span className="text-sm text-gray-400">{metric.title}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1 font-mono">{metric.value}</p>
                <p className={`text-sm ${
                  metric.changeType === 'positive' ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                }`}>
                  {metric.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sector Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1c1f26',
                    border: '1px solid #3bc9f4',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {allocationData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-300">{item.name}</span>
                <span className="text-sm text-gray-400">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <XAxis 
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8b949e', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8b949e', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1f26',
                    border: '1px solid #3bc9f4',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="portfolio" fill="#3bc9f4" name="Portfolio" />
                <Bar dataKey="benchmark" fill="#6b7280" name="Benchmark" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
