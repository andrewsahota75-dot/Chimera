
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Target, Activity, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
// import DailyPerformanceView from '../../../components/DailyPerformanceView';

const AnalyticsPage: React.FC = () => {
    const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
    const [activeTab, setActiveTab] = useState('performance');

    // Mock data for analytics
    const performanceData = [
        { time: '9:30', liveEquity: 100000, backtestEquity: 100000 },
        { time: '10:00', liveEquity: 101500, backtestEquity: 101200 },
        { time: '10:30', liveEquity: 103000, backtestEquity: 102800 },
        { time: '11:00', liveEquity: 102200, backtestEquity: 102900 },
        { time: '11:30', liveEquity: 104500, backtestEquity: 104200 },
        { time: '12:00', liveEquity: 106000, backtestEquity: 105800 },
        { time: '12:30', liveEquity: 105200, backtestEquity: 105900 },
        { time: '13:00', liveEquity: 107800, backtestEquity: 107500 },
        { time: '13:30', liveEquity: 109200, backtestEquity: 108800 },
        { time: '14:00', liveEquity: 108500, backtestEquity: 109100 },
        { time: '14:30', liveEquity: 110300, backtestEquity: 109900 },
        { time: '15:00', liveEquity: 111800, backtestEquity: 111200 }
    ];

    const allocationData = [
        { name: 'Technology', value: 45, color: '#3bc9f4' },
        { name: 'Healthcare', value: 25, color: '#2ecc71' },
        { name: 'Finance', value: 20, color: '#e74c3c' },
        { name: 'Consumer', value: 10, color: '#f39c12' }
    ];

    const metricsData = [
        { title: 'Total Return', value: '11.8%', subtitle: 'Since inception', icon: TrendingUp, color: '#2ecc71' },
        { title: 'Sharpe Ratio', value: '1.42', subtitle: 'Risk-adjusted return', icon: Target, color: '#3bc9f4' },
        { title: 'Max Drawdown', value: '-3.2%', subtitle: 'Worst decline', icon: Activity, color: '#e74c3c' },
        { title: 'Win Rate', value: '68.3%', subtitle: 'Profitable trades', icon: BarChart3, color: '#f39c12' }
    ];

    const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y'];
    const tabs = [
        { id: 'performance', label: 'Performance', icon: TrendingUp },
        { id: 'daily', label: 'Daily Performance', icon: BarChart3 },
        { id: 'allocation', label: 'Allocation', icon: PieChartIcon },
        { id: 'risk', label: 'Risk Metrics', icon: Target }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                <div className="flex items-center space-x-2">
                    {timeframes.map((timeframe) => (
                        <button
                            key={timeframe}
                            onClick={() => setSelectedTimeframe(timeframe)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                selectedTimeframe === timeframe
                                    ? 'bg-[#3bc9f4] text-white'
                                    : 'bg-[#1c1f26] text-gray-400 hover:text-white'
                            }`}
                        >
                            {timeframe}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricsData.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                        <div key={index} className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
                                    <Icon className="w-5 h-5" style={{ color: metric.color }} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-1">{metric.title}</p>
                                <p className="text-2xl font-bold text-white mb-1 font-mono">{metric.value}</p>
                                <p className="text-xs text-gray-500">{metric.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-[#1c1f26] rounded-lg p-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-[#3bc9f4] text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'performance' && (
                <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Live vs Backtest Performance</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="time" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1c1f26', 
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="liveEquity" 
                                    stroke="#3bc9f4" 
                                    strokeWidth={2} 
                                    name="Live Trading"
                                    dot={false}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="backtestEquity" 
                                    stroke="#2ecc71" 
                                    strokeWidth={2} 
                                    name="Backtest"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'daily' && (
                <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Daily Performance View</h2>
                    <p className="text-gray-400">Daily performance chart will be displayed here.</p>
                </div>
            )}

            {activeTab === 'allocation' && (
                <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Portfolio Allocation</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allocationData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}%`}
                                    >
                                        {allocationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                            {allocationData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-[#0e1117] rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div 
                                            className="w-4 h-4 rounded-full" 
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-white font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-gray-400 font-mono">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'risk' && (
                <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Risk Analysis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-[#0e1117] rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400">Value at Risk (95%)</span>
                                    <span className="text-white font-mono">-$2,341</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                                </div>
                            </div>
                            <div className="p-4 bg-[#0e1117] rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400">Beta (vs S&P 500)</span>
                                    <span className="text-white font-mono">0.87</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                                </div>
                            </div>
                            <div className="p-4 bg-[#0e1117] rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400">Correlation to Market</span>
                                    <span className="text-white font-mono">0.72</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-[#0e1117] rounded-lg">
                                <h3 className="text-white font-medium mb-2">Risk Metrics</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Volatility (Annual)</span>
                                        <span className="text-white">18.2%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Sortino Ratio</span>
                                        <span className="text-white">1.84</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Calmar Ratio</span>
                                        <span className="text-white">3.69</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Information Ratio</span>
                                        <span className="text-white">0.45</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;
