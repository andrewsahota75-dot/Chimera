
import React, { useState } from 'react';
import { Play, Pause, Settings, Plus, TrendingUp, BarChart3, Target, Zap, X } from 'lucide-react';

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
    const [showParametersModal, setShowParametersModal] = useState(false);
    const [showPerformanceModal, setShowPerformanceModal] = useState(false);
    const [editableParameters, setEditableParameters] = useState<any>({});
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'equity' | 'crypto'>('all');

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
                                                    onClick={() => {
                                                        setSelectedStrategy(strategy);
                                                        setShowPerformanceModal(true);
                                                    }}
                                                    className="p-2 bg-[#3bc9f4]/20 text-[#3bc9f4] rounded-lg hover:bg-[#3bc9f4]/30 transition-colors"
                                                    title="View Performance"
                                                >
                                                    <TrendingUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedStrategy(strategy);
                                                        setEditableParameters({ ...strategy.parameters });
                                                        setShowParametersModal(true);
                                                    }}
                                                    className="p-2 bg-[#f39c12]/20 text-[#f39c12] rounded-lg hover:bg-[#f39c12]/30 transition-colors ml-2"
                                                    title="Edit Parameters"
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

            {/* Strategy Performance Modal */}
            {selectedStrategy && showPerformanceModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#0e1117] rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{selectedStrategy.name} Performance</h2>
                            <button 
                                onClick={() => {
                                    setShowPerformanceModal(false);
                                    setSelectedStrategy(null);
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Performance Summary */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-[#1c1f26] rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Total P&L</div>
                                    <div className={`text-xl font-bold ${
                                        selectedStrategy.pnl >= 0 ? 'text-[#2ecc71]' : 'text-[#e74c3c]'
                                    }`}>
                                        ₹{selectedStrategy.pnl.toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-[#1c1f26] rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Win Rate</div>
                                    <div className="text-xl font-bold text-white">{selectedStrategy.winRate}%</div>
                                </div>
                                <div className="bg-[#1c1f26] rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Total Trades</div>
                                    <div className="text-xl font-bold text-white">{selectedStrategy.trades}</div>
                                </div>
                                <div className="bg-[#1c1f26] rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Avg Return</div>
                                    <div className="text-xl font-bold text-[#3bc9f4]">
                                        ₹{(selectedStrategy.pnl / selectedStrategy.trades).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Recent Trades */}
                            <div>
                                <h3 className="text-lg font-medium text-white mb-3">Recent Trades</h3>
                                <div className="bg-[#1c1f26] rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-[#0e1117]">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm text-gray-400">Time</th>
                                                <th className="px-4 py-3 text-left text-sm text-gray-400">Side</th>
                                                <th className="px-4 py-3 text-left text-sm text-gray-400">Price</th>
                                                <th className="px-4 py-3 text-left text-sm text-gray-400">Quantity</th>
                                                <th className="px-4 py-3 text-left text-sm text-gray-400">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1,2,3,4,5].map((i) => (
                                                <tr key={i} className="border-t border-gray-700">
                                                    <td className="px-4 py-3 text-sm text-gray-300">{new Date(Date.now() - i * 3600000).toLocaleTimeString()}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                            i % 2 === 0 ? 'bg-[#2ecc71]/20 text-[#2ecc71]' : 'bg-[#e74c3c]/20 text-[#e74c3c]'
                                                        }`}>
                                                            {i % 2 === 0 ? 'BUY' : 'SELL'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-white">₹{(2450 + i * 10).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-sm text-white">{100 - i * 5}</td>
                                                    <td className={`px-4 py-3 text-sm font-medium ${
                                                        (i % 3 === 0) ? 'text-[#e74c3c]' : 'text-[#2ecc71]'
                                                    }`}>
                                                        {(i % 3 === 0) ? '-' : '+'}₹{(Math.random() * 500).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Strategy Parameters Edit Modal */}
            {selectedStrategy && showParametersModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#0e1117] rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Edit {selectedStrategy.name} Parameters</h2>
                            <button 
                                onClick={() => {
                                    setShowParametersModal(false);
                                    setSelectedStrategy(null);
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {Object.entries(editableParameters).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-sm text-gray-400 mb-2 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1')}
                                    </label>
                                    <input
                                        type="number"
                                        value={value as number}
                                        onChange={(e) => setEditableParameters(prev => ({
                                            ...prev,
                                            [key]: parseFloat(e.target.value) || 0
                                        }))}
                                        className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
                                    />
                                </div>
                            ))}
                            
                            <div className="flex space-x-3 pt-4">
                                <button 
                                    onClick={() => {
                                        // Update strategy parameters
                                        setStrategies(prev => prev.map(s => 
                                            s.id === selectedStrategy.id 
                                                ? { ...s, parameters: editableParameters }
                                                : s
                                        ));
                                        setShowParametersModal(false);
                                        setSelectedStrategy(null);
                                        // In real implementation, this would save to backend/YAML
                                        alert('Parameters updated successfully!');
                                    }}
                                    className="px-4 py-2 bg-[#3bc9f4] text-white rounded-lg hover:bg-[#3bc9f4]/80 transition-colors"
                                >
                                    Save Parameters
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowParametersModal(false);
                                        setSelectedStrategy(null);
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StrategiesPage;
