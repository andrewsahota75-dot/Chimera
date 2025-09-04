import React from 'react';
import { Activity, Zap, TestTube } from 'lucide-react';
import { getTradingModeColor, getTradingModeBgColor, getTradingModeDescription } from '../utils/tradingModes';

interface TradingModeToggleProps {
  mode: 'test' | 'paper' | 'live';
  onModeChange: (mode: 'test' | 'paper' | 'live') => void;
  disabled?: boolean;
}

const TradingModeToggle: React.FC<TradingModeToggleProps> = ({
  mode,
  onModeChange,
  disabled = false
}) => {
  const getModeConfig = (selectedMode: 'test' | 'paper' | 'live') => {
    switch (selectedMode) {
      case 'test':
        return { color: 'bg-blue-500', icon: TestTube, label: 'TEST' };
      case 'paper':
        return { color: 'bg-yellow-500', icon: Activity, label: 'PAPER' };
      case 'live':
        return { color: 'bg-red-500', icon: Zap, label: 'LIVE' };
    }
  };

  const currentConfig = getModeConfig(mode);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-400">Trading Mode:</span>
        <div className="flex items-center bg-[#1c1f26] rounded-lg p-1 border border-gray-700/50">
          <button
            onClick={() => onModeChange('test')}
            disabled={disabled}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'test'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2e39]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <TestTube className="w-4 h-4" />
            <span>Test</span>
          </button>

          <button
            onClick={() => onModeChange('paper')}
            disabled={disabled}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'paper'
                ? 'bg-yellow-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2e39]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Activity className="w-4 h-4" />
            <span>Paper</span>
          </button>

          <button
            onClick={() => onModeChange('live')}
            disabled={disabled}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'live'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2e39]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Zap className="w-4 h-4" />
            <span>Live</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 ${currentConfig.color} rounded-full animate-pulse`} />
          <span className={`text-xs font-medium ${getTradingModeColor(mode)}`}>
            {currentConfig.label}
          </span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 ml-20 max-w-md">
        {getTradingModeDescription(mode)}
      </div>
    </div>
  );
};

export default TradingModeToggle;