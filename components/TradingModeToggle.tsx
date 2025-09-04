import React from 'react';
import { Activity, Zap } from 'lucide-react';

interface TradingModeToggleProps {
  mode: 'live' | 'paper';
  onModeChange: (mode: 'live' | 'paper') => void;
  disabled?: boolean;
}

const TradingModeToggle: React.FC<TradingModeToggleProps> = ({
  mode,
  onModeChange,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-gray-400">Trading Mode:</span>
      <div className="flex items-center bg-[#1c1f26] rounded-lg p-1 border border-gray-700/50">
        <button
          onClick={() => onModeChange('paper')}
          disabled={disabled}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'paper'
              ? 'bg-[#f39c12] text-white shadow-sm'
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
              ? 'bg-[#2ecc71] text-white shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-[#2a2e39]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Zap className="w-4 h-4" />
          <span>Live</span>
        </button>
      </div>

      {mode === 'live' && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-[#2ecc71] rounded-full animate-pulse" />
          <span className="text-xs text-[#2ecc71] font-medium">LIVE</span>
        </div>
      )}

      {mode === 'paper' && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-[#f39c12] rounded-full animate-pulse" />
          <span className="text-xs text-[#f39c12] font-medium">PAPER</span>
        </div>
      )}
    </div>
  );
};

export default TradingModeToggle;