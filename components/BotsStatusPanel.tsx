import React from 'react';
import { Activity, DollarSign, Target, Clock, Zap, AlertCircle } from 'lucide-react';
import { BotStatus } from '../types';
import { useLiveTimestamp } from '../hooks/useRealTimeUpdates';

interface BotsStatusPanelProps {
  bots: BotStatus[];
}

export default function BotsStatusPanel({ bots }: BotsStatusPanelProps) {
  const { formatTime } = useLiveTimestamp();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-[#2ecc71] bg-[#2ecc71]/20';
      case 'paused': return 'text-[#f39c12] bg-[#f39c12]/20';
      case 'stopped': return 'text-[#e74c3c] bg-[#e74c3c]/20';
      case 'error': return 'text-[#e74c3c] bg-[#e74c3c]/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return Activity;
      case 'paused': return Clock;
      case 'stopped': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Activity;
    }
  };

  return (
    <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50">
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Trading Status</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#2ecc71] rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">Live</span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {bots.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
            <p className="text-gray-400">No bots configured</p>
            <p className="text-sm text-gray-500 mt-1">Add bots through the Strategies page</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Equity Section */}
            <div className="bg-[#0e1117] p-4 rounded-lg border border-gray-600/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Equity</span>
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  bots.filter(bot => bot.name.includes('Equity')).some(bot => bot.status === 'running') 
                    ? 'text-green-400 bg-green-400/20' 
                    : 'text-red-400 bg-red-400/20'
                }`}>
                  {bots.filter(bot => bot.name.includes('Equity')).some(bot => bot.status === 'running') ? 'Running' : 'Stopped'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bots.filter(bot => bot.name.includes('Equity')).map((bot, index) => {
              const StatusIcon = getStatusIcon(bot.status);
              const statusColor = getStatusColor(bot.status);
              
                  return (
                    <div
                      key={index}
                      className="bg-[#1c1f26] p-3 rounded border border-gray-700/50 hover:border-gray-500/50 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded ${statusColor}`}>
                            <StatusIcon className="w-3 h-3" />
                          </div>
                          <h5 className="text-sm font-medium text-white">{bot.strategy.name}</h5>
                        </div>
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${statusColor}`}>
                          {bot.status === 'running' ? 'Active' : bot.status === 'error' ? 'Stopped' : 'Stopped'}
                        </span>
                      </div>
                  
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Symbol</span>
                          <span className="text-xs text-white font-medium">{bot.strategy.symbol}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">P&L</span>
                          <span className={`text-xs font-medium ${
                            bot.pnl >= 0 
                              ? 'text-[#2ecc71]' 
                              : 'text-[#e74c3c]'
                          }`}>
                            {bot.pnl >= 0 ? '+' : ''}${bot.pnl.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Crypto Section */}
            <div className="bg-[#0e1117] p-4 rounded-lg border border-gray-600/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Crypto</span>
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  bots.filter(bot => bot.name.includes('Crypto')).some(bot => bot.status === 'running') 
                    ? 'text-green-400 bg-green-400/20' 
                    : 'text-red-400 bg-red-400/20'
                }`}>
                  {bots.filter(bot => bot.name.includes('Crypto')).some(bot => bot.status === 'running') ? 'Running' : 'Stopped'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bots.filter(bot => bot.name.includes('Crypto')).map((bot, index) => {
                  const StatusIcon = getStatusIcon(bot.status);
                  const statusColor = getStatusColor(bot.status);
                  
                  return (
                    <div
                      key={index}
                      className="bg-[#1c1f26] p-3 rounded border border-gray-700/50 hover:border-gray-500/50 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded ${statusColor}`}>
                            <StatusIcon className="w-3 h-3" />
                          </div>
                          <h5 className="text-sm font-medium text-white">{bot.strategy.name}</h5>
                        </div>
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${statusColor}`}>
                          {bot.status === 'running' ? 'Active' : bot.status === 'error' ? 'Stopped' : 'Stopped'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Symbol</span>
                          <span className="text-xs text-white font-medium">{bot.strategy.symbol}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">P&L</span>
                          <span className={`text-xs font-medium ${
                            bot.pnl >= 0 
                              ? 'text-[#2ecc71]' 
                              : 'text-[#e74c3c]'
                          }`}>
                            {bot.pnl >= 0 ? '+' : ''}${bot.pnl.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}