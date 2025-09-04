import { TradingMode } from '../types';

export const tradingModes: TradingMode[] = [
  {
    mode: 'test',
    description: 'Uses simulated/system-generated data for interface testing. No real market data or trades.'
  },
  {
    mode: 'paper',
    description: 'Uses real-time market data but executes simulated trades. Perfect for testing strategies.'
  },
  {
    mode: 'live',
    description: 'Uses real market data and executes actual trades. Real money at risk.'
  }
];

export const getTradingModeDescription = (mode: 'test' | 'paper' | 'live'): string => {
  const tradingMode = tradingModes.find(tm => tm.mode === mode);
  return tradingMode?.description || 'Unknown trading mode';
};

export const isTradingModeValid = (mode: string): mode is 'test' | 'paper' | 'live' => {
  return ['test', 'paper', 'live'].includes(mode);
};

export const getTradingModeColor = (mode: 'test' | 'paper' | 'live'): string => {
  switch (mode) {
    case 'test':
      return 'text-blue-400';
    case 'paper':
      return 'text-yellow-400';
    case 'live':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

export const getTradingModeBgColor = (mode: 'test' | 'paper' | 'live'): string => {
  switch (mode) {
    case 'test':
      return 'bg-blue-500/20';
    case 'paper':
      return 'bg-yellow-500/20';
    case 'live':
      return 'bg-red-500/20';
    default:
      return 'bg-gray-500/20';
  }
};