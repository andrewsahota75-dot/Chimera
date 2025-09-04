import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, TrendingUp, DollarSign } from 'lucide-react';

interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  change: number;
  changePercent: number;
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [convertedAmount, setConvertedAmount] = useState('83500.00');
  const [exchangeRate, setExchangeRate] = useState('83.50');
  const [isLoading, setIsLoading] = useState(false);

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' }
  ];

  const mockRates: Record<string, Record<string, number>> = {
    USD: { EUR: 0.85, GBP: 0.73, INR: 83.50, JPY: 110.25, CAD: 1.25, AUD: 1.35, CHF: 0.92, CNY: 7.10, BTC: 0.000023, ETH: 0.00035 },
    EUR: { USD: 1.18, GBP: 0.86, INR: 98.30, JPY: 130.15, CAD: 1.47, AUD: 1.59, CHF: 1.08, CNY: 8.37, BTC: 0.000027, ETH: 0.00041 },
    GBP: { USD: 1.37, EUR: 1.16, INR: 114.40, JPY: 151.25, CAD: 1.71, AUD: 1.85, CHF: 1.26, CNY: 9.73, BTC: 0.000032, ETH: 0.00048 },
    INR: { USD: 0.012, EUR: 0.0102, GBP: 0.0087, JPY: 1.32, CAD: 0.015, AUD: 0.016, CHF: 0.011, CNY: 0.085, BTC: 0.000000275, ETH: 0.0000042 },
    BTC: { USD: 43500, EUR: 37000, GBP: 31750, INR: 3632250, JPY: 4785750, CAD: 54375, AUD: 58725, CHF: 40020, CNY: 308850, ETH: 15.2 },
    ETH: { USD: 2850, EUR: 2422, GBP: 2080, INR: 238175, JPY: 314212, CAD: 3562, AUD: 3847, CHF: 2622, CNY: 20235, BTC: 0.0658 }
  };

  const convertCurrency = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const numAmount = parseFloat(amount) || 0;
      const rate = mockRates[fromCurrency]?.[toCurrency] || 1;
      const converted = numAmount * rate;
      
      setConvertedAmount(converted.toFixed(2));
      setExchangeRate(rate.toFixed(6));
      setIsLoading(false);
    }, 500);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      convertCurrency();
    }
  }, [amount, fromCurrency, toCurrency]);

  const popularPairs = [
    { from: 'USD', to: 'INR', rate: '83.50', change: '+0.25' },
    { from: 'EUR', to: 'USD', rate: '1.18', change: '-0.02' },
    { from: 'GBP', to: 'USD', rate: '1.37', change: '+0.01' },
    { from: 'BTC', to: 'USD', rate: '43,500', change: '+2.5%' }
  ];

  return (
    <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50">
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center space-x-2">
          <ArrowLeftRight className="w-5 h-5 text-[#3bc9f4]" />
          <h3 className="text-lg font-semibold text-white">Currency Converter</h3>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
            placeholder="Enter amount"
          />
        </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
            <div className="flex space-x-2">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="flex-1 bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <button
                onClick={swapCurrencies}
                className="p-2 bg-[#3bc9f4]/20 text-[#3bc9f4] rounded-lg hover:bg-[#3bc9f4]/30 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="bg-[#0e1117] rounded-lg p-4 border border-gray-600/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Converted Amount</span>
            {isLoading && <div className="w-4 h-4 border-2 border-[#3bc9f4] border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {currencies.find(c => c.code === toCurrency)?.symbol}{convertedAmount}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            1 {fromCurrency} = {exchangeRate} {toCurrency}
          </div>
        </div>

        {/* Popular Pairs */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Popular Pairs</h4>
          <div className="grid grid-cols-2 gap-2">
            {popularPairs.map((pair, index) => (
              <button
                key={index}
                onClick={() => {
                  setFromCurrency(pair.from);
                  setToCurrency(pair.to);
                }}
                className="bg-[#0e1117] border border-gray-600/50 rounded-lg p-3 text-left hover:border-gray-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {pair.from}/{pair.to}
                  </span>
                  <span className={`text-xs ${pair.change.startsWith('+') ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`}>
                    {pair.change}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">{pair.rate}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}