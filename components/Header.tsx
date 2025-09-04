import React, { useState } from 'react';
import { Bell, Settings, User, Terminal } from 'lucide-react';
import TradingModeToggle from './TradingModeToggle';

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [tradingMode, setTradingMode] = useState<'live' | 'paper'>('paper');
  const [notifications] = useState(3);

  const handleModeChange = (mode: 'live' | 'paper') => {
    setTradingMode(mode);
    // In a real app, this would trigger mode change in the backend
    console.log(`Trading mode changed to: ${mode}`);
  };

  return (
    <header className="bg-[#1c1f26] border-b border-gray-700/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Terminal className="w-8 h-8 text-[#3bc9f4]" />
            <div>
              <h1 className="text-xl font-bold text-white">Chimera Terminal</h1>
              <p className="text-sm text-gray-400">Advanced Trading Platform</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <TradingModeToggle 
            mode={tradingMode} 
            onModeChange={handleModeChange}
          />

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onNavigate?.('notifications')}
              className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e74c3c] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            <button 
              onClick={() => onNavigate?.('settings')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button 
              onClick={() => onNavigate?.('accounts')}
              className="flex items-center space-x-2 p-2 bg-[#3bc9f4]/20 text-[#3bc9f4] rounded-lg hover:bg-[#3bc9f4]/30 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">Trader</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;