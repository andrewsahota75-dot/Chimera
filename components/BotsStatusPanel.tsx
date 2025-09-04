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
          <h3 className="text-lg font-semibold text-white">Bot Status Dashboard</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map((bot, index) => {
              const StatusIcon = getStatusIcon(bot.status);
              const statusColor = getStatusColor(bot.status);
              
              return (
                <div
                  key={index}
                  className="bg-[#0e1117] p-4 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${statusColor}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <h4 className="font-medium text-white">{bot.name}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                      {bot.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Strategy</span>
                      <span className="text-sm text-white font-medium">{bot.strategy.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">P&L</span>
                      <span className={`text-sm font-medium ${
                        bot.pnl >= 0 
                          ? 'text-[#2ecc71]' 
                          : 'text-[#e74c3c]'
                      }`}>
                        {bot.pnl >= 0 ? '+' : ''}${bot.pnl.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Last Update</span>
                      <span className="text-sm text-gray-300">
                        {formatTime(new Date(bot.lastUpdate))}
                      </span>
                    </div>
                  </div>
                  
                  {bot.status === 'running' && (
                    <div className="mt-3 pt-3 border-t border-gray-600/50">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-[#2ecc71] rounded-full animate-pulse" />
                        <span className="text-xs text-gray-400">Active trading</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}