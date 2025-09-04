
import React, { useState } from 'react';
import { Play, Pause, Settings, Plus, TrendingUp, BarChart3, Target, Zap } from 'lucide-react';

interface Strategy {
    id: string;
    name: string;
    category: 'equity' | 'crypto';
    status: 'running' | 'stopped' | 'paused';
    symbol: string;
    pnl: number;
    pnlPercent: number;
    trades: number;
    winRate: number;
    lastSignal: string;
    parameters: Record<string, any>;
    assetSpecific?: boolean;
    description?: string;
}

const StrategiesPage: React.FC = () => {
    const [strategies, setStrategies] = useState<Strategy[]>([
        {
            id: '1',
            name: 'Mean Reversion',
            category: 'equity',
            status: 'running',
            symbol: 'RELIANCE',
            pnl: 2450.50,
            pnlPercent: 3.2,
            trades: 12,
            winRate: 75,
            lastSignal: 'BUY',
            assetSpecific: true,
            description: 'Reverts to mean price when overextended',
            parameters: {
                lookback: 20,
                threshold: 2.0,
                stopLoss: 1.5,
                positionSize: 100
            }
        },
        {
            id: '2',
            name: 'Momentum',
            category: 'equity',
            status: 'running',
            symbol: 'TCS',
            pnl: -450.25,
            pnlPercent: -0.8,
            trades: 8,
            winRate: 62.5,
            lastSignal: 'SELL',
            assetSpecific: false,
            description: 'Follows price momentum with RSI confirmation',
            parameters: {
                period: 14,
                rsiThreshold: 70,
                stopLoss: 2.0,
                takeProfit: 3.0
            }
        },
        {
            id: '3',
            name: 'Breakout',
            category: 'equity',
            status: 'stopped',
            symbol: 'HDFC',
            pnl: 1250.75,
            pnlPercent: 1.9,
            trades: 5,
            winRate: 80,
            lastSignal: 'HOLD',
            assetSpecific: true,
            description: 'Trades breakouts from consolidation ranges',
            parameters: {
                breakoutLevel: 0.02,
                volume: 1.5,
                stopLoss: 1.0,
                minimumRange: 0.5
            }
        },
        {
            id: '4',
            name: 'Grid Trading',
            category: 'crypto',
            status: 'running',
            symbol: 'BTC/USDT',
            pnl: 3200.80,
            pnlPercent: 4.5,
            trades: 24,
            winRate: 85,
            lastSignal: 'BUY',
            assetSpecific: false,
            description: 'Places buy/sell orders at regular intervals',
            parameters: {
                gridSpacing: 0.005,
                gridLevels: 10,
                orderSize: 0.01,
                basePrice: 43000
            }
        },
        {
            id: '5',
            name: 'DCA Bot',
            category: 'crypto',
            status: 'running',
            symbol: 'ETH/USDT',
            pnl: 875.25,
            pnlPercent: 2.1,
            trades: 15,
            winRate: 70,
            lastSignal: 'BUY',
            assetSpecific: true,
            description: 'Dollar cost averaging with technical indicators',
            parameters: {
                interval: '1h',
                amount: 100,
                rsiEntry: 30,
                takeProfitPercent: 15
            }
        }
    ]);

    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'equity' | 'crypto'>('all');
    const [showParametersModal, setShowParametersModal] = useState(false);

    const toggleStrategy = (id: string) => {
        setStrategies(prev => prev.map(strategy => 
            strategy.id === id 
                ? { 
                    ...strategy, 
                    status: strategy.status === 'running' ? 'stopped' : 'running' 
                  }
                : strategy
        ));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'text-green-400';
            case 'stopped': return 'text-red-400';
            case 'paused': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running': return Play;
            case 'stopped': return Pause;
            case 'paused': return Pause;
            default: return Pause;
        }
    };

    const filteredStrategies = selectedCategory === 'all' 
        ? strategies 
        : strategies.filter(strategy => strategy.category === selectedCategory);
    
    const totalPnl = filteredStrategies.reduce((sum, strategy) => sum + strategy.pnl, 0);
    const totalTrades = filteredStrategies.reduce((sum, strategy) => sum + strategy.trades, 0);
    const avgWinRate = filteredStrategies.length > 0 
        ? filteredStrategies.reduce((sum, strategy) => sum + strategy.winRate, 0) / filteredStrategies.length 
        : 0;

    const updateStrategyParameters = (strategyId: string, parameters: Record<string, any>) => {
        setStrategies(prev => prev.map(strategy => 
            strategy.id === strategyId 
                ? { ...strategy, parameters }
                : strategy
        ));
        setShowParametersModal(false);
        setSelectedStrategy(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Trading Strategies</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage and monitor your automated trading strategies</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex bg-[#0e1117] border border-gray-600 rounded-lg p-1">
                        {(['all', 'equity', 'crypto'] as const).map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                    selectedCategory === category
                                        ? 'bg-[#3bc9f4] text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>
                    {/* New Strategy button removed per user request */}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-[#3bc9f4]/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-[#3bc9f4]" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Total P&L</p>
                        <p className={`text-2xl font-bold mb-1 font-mono ${
                            totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                            {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-[#2ecc71]/20 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-[#2ecc71]" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Total Trades</p>
                        <p className="text-2xl font-bold text-white mb-1 font-mono">{totalTrades}</p>
                    </div>
                </div>

                <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-[#f39c12]/20 rounded-lg">
                            <Target className="w-5 h-5 text-[#f39c12]" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Avg Win Rate</p>
                        <p className="text-2xl font-bold text-white mb-1 font-mono">{avgWinRate.toFixed(1)}%</p>
                    </div>
                </div>

                <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-[#e74c3c]/20 rounded-lg">
                            <Zap className="w-5 h-5 text-[#e74c3c]" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Active Strategies</p>
                        <p className="text-2xl font-bold text-white mb-1 font-mono">
                            {strategies.filter(s => s.status === 'running').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Strategies Table */}
            <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white">Strategy Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0e1117]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Strategy
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Symbol
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    P&L
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Trades
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Win Rate
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Last Signal
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {strategies.map((strategy) => {
                                const StatusIcon = getStatusIcon(strategy.status);
                                return (
                                    <tr key={strategy.id} className="hover:bg-[#0e1117]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">{strategy.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`flex items-center space-x-2 ${getStatusColor(strategy.status)}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                <span className="text-sm font-medium capitalize">{strategy.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-white font-mono">{strategy.symbol}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className={`font-mono ${strategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {strategy.pnl >= 0 ? '+' : ''}₹{strategy.pnl.toFixed(2)}
                                                </div>
                                                <div className={`text-xs ${strategy.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {strategy.pnlPercent >= 0 ? '+' : ''}{strategy.pnlPercent.toFixed(2)}%
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-white font-mono">{strategy.trades}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-white font-mono">{strategy.winRate}%</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                strategy.lastSignal === 'BUY' ? 'bg-green-900 text-green-200' :
                                                strategy.lastSignal === 'SELL' ? 'bg-red-900 text-red-200' :
                                                'bg-gray-900 text-gray-200'
                                            }`}>
                                                {strategy.lastSignal}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => toggleStrategy(strategy.id)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        strategy.status === 'running'
                                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    }`}
                                                >
                                                    {strategy.status === 'running' ? 
                                                        <Pause className="w-4 h-4" /> : 
                                                        <Play className="w-4 h-4" />
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => setSelectedStrategy(strategy)}
                                                    className="p-2 bg-[#3bc9f4]/20 text-[#3bc9f4] rounded-lg hover:bg-[#3bc9f4]/30 transition-colors"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Strategy Details Modal */}
            {selectedStrategy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-white mb-4">{selectedStrategy.name} Parameters</h3>
                        <div className="space-y-3">
                            {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="text-white font-mono">{value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setSelectedStrategy(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => {
                                    // Here you would normally open a parameter editing interface
                                    // For now, just close the modal
                                    setSelectedStrategy(null);
                                    alert('Parameters updated successfully!');
                                }}
                                className="px-4 py-2 bg-[#3bc9f4] text-white rounded-lg hover:bg-[#3bc9f4]/80 transition-colors"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StrategiesPage;
