import React, { useState } from 'react';
import { 
  Settings, 
  Monitor, 
  DollarSign, 
  Shield, 
  Bell, 
  Palette,
  Save,
  RotateCcw
} from 'lucide-react';
import CurrencyConverter from '../components/CurrencyConverter';

interface SettingsPageProps {}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [activeTab, setActiveTab] = useState('trading');
  const [settings, setSettings] = useState({
    trading: {
      defaultQuantity: 100,
      maxPositionSize: 10000,
      riskPerTrade: 2,
      autoStop: true,
      confirmOrders: true,
      paperTrading: true
    },
    display: {
      theme: 'dark',
      currency: 'USD',
      decimalPlaces: 2,
      autoRefresh: 5,
      showNotifications: true,
      soundAlerts: false
    },
    account: {
      username: 'Trader',
      email: 'trader@example.com',
      twoFactorAuth: false,
      sessionTimeout: 60,
      apiAccess: false
    },
    api: {
      zerodhaKey: '',
      zerodhaSecret: '',
      binanceKey: '',
      binanceSecret: '',
      telegramToken: '',
      alphaVantageKey: ''
    }
  });

  const tabs = [
    { id: 'trading', label: 'Trading', icon: DollarSign },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Settings }
  ];

  const updateSetting = (category: keyof typeof settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const resetSettings = () => {
    setSettings({
      trading: {
        defaultQuantity: 100,
        maxPositionSize: 10000,
        riskPerTrade: 2,
        autoStop: true,
        confirmOrders: true,
        paperTrading: true
      },
      display: {
        theme: 'dark',
        currency: 'USD',
        decimalPlaces: 2,
        autoRefresh: 5,
        showNotifications: true,
        soundAlerts: false
      },
      account: {
        username: 'Trader',
        email: 'trader@example.com',
        twoFactorAuth: false,
        sessionTimeout: 60,
        apiAccess: false
      }
    });
  };

  const saveSettings = () => {
    // Simulate saving
    alert('Settings saved successfully!');
  };

  const renderTradingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Default Quantity
          </label>
          <input
            type="number"
            value={settings.trading.defaultQuantity}
            onChange={(e) => updateSetting('trading', 'defaultQuantity', parseInt(e.target.value))}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Position Size
          </label>
          <input
            type="number"
            value={settings.trading.maxPositionSize}
            onChange={(e) => updateSetting('trading', 'maxPositionSize', parseInt(e.target.value))}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Risk Per Trade (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={settings.trading.riskPerTrade}
            onChange={(e) => updateSetting('trading', 'riskPerTrade', parseFloat(e.target.value))}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Auto Stop Loss</span>
          <button
            onClick={() => updateSetting('trading', 'autoStop', !settings.trading.autoStop)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.trading.autoStop ? 'bg-[#3bc9f4]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.trading.autoStop ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Confirm Orders</span>
          <button
            onClick={() => updateSetting('trading', 'confirmOrders', !settings.trading.confirmOrders)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.trading.confirmOrders ? 'bg-[#3bc9f4]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.trading.confirmOrders ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Paper Trading Mode</span>
          <button
            onClick={() => updateSetting('trading', 'paperTrading', !settings.trading.paperTrading)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.trading.paperTrading ? 'bg-[#3bc9f4]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.trading.paperTrading ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Theme
          </label>
          <select
            value={settings.display.theme}
            onChange={(e) => updateSetting('display', 'theme', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Currency
          </label>
          <select
            value={settings.display.currency}
            onChange={(e) => updateSetting('display', 'currency', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Decimal Places
          </label>
          <select
            value={settings.display.decimalPlaces}
            onChange={(e) => updateSetting('display', 'decimalPlaces', parseInt(e.target.value))}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          >
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Auto Refresh (seconds)
          </label>
          <select
            value={settings.display.autoRefresh}
            onChange={(e) => updateSetting('display', 'autoRefresh', parseInt(e.target.value))}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          >
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="30">30</option>
            <option value="60">60</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Show Notifications</span>
          <button
            onClick={() => updateSetting('display', 'showNotifications', !settings.display.showNotifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.display.showNotifications ? 'bg-[#3bc9f4]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.display.showNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Sound Alerts</span>
          <button
            onClick={() => updateSetting('display', 'soundAlerts', !settings.display.soundAlerts)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.display.soundAlerts ? 'bg-[#3bc9f4]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.display.soundAlerts ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={settings.account.username}
            onChange={(e) => updateSetting('account', 'username', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={settings.account.email}
            onChange={(e) => updateSetting('account', 'email', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Session Timeout (minutes)
          </label>
          <select
            value={settings.account.sessionTimeout}
            onChange={(e) => updateSetting('account', 'sessionTimeout', parseInt(e.target.value))}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
          >
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="60">60</option>
            <option value="120">120</option>
            <option value="480">480</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Two-Factor Authentication</span>
          <button
            onClick={() => updateSetting('account', 'twoFactorAuth', !settings.account.twoFactorAuth)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.account.twoFactorAuth ? 'bg-[#3bc9f4]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.account.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">API Access</span>
          <button
            onClick={() => updateSetting('account', 'apiAccess', !settings.account.apiAccess)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.account.apiAccess ? 'bg-[#3bc9f4]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.account.apiAccess ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      <div className="bg-[#1c1f26] rounded-lg p-4 border border-gray-600">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Danger Zone</h4>
        <button className="bg-[#e74c3c] hover:bg-[#c0392b] text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Zerodha API Key
          </label>
          <input
            type="password"
            value={settings.api.zerodhaKey}
            onChange={(e) => updateSetting('api', 'zerodhaKey', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
            placeholder="Enter Zerodha API key"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Zerodha API Secret
          </label>
          <input
            type="password"
            value={settings.api.zerodhaSecret}
            onChange={(e) => updateSetting('api', 'zerodhaSecret', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
            placeholder="Enter Zerodha API secret"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Binance API Key
          </label>
          <input
            type="password"
            value={settings.api.binanceKey}
            onChange={(e) => updateSetting('api', 'binanceKey', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
            placeholder="Enter Binance API key"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Binance API Secret
          </label>
          <input
            type="password"
            value={settings.api.binanceSecret}
            onChange={(e) => updateSetting('api', 'binanceSecret', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
            placeholder="Enter Binance API secret"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telegram Bot Token
          </label>
          <input
            type="password"
            value={settings.api.telegramToken}
            onChange={(e) => updateSetting('api', 'telegramToken', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
            placeholder="Enter Telegram bot token"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Alpha Vantage API Key
          </label>
          <input
            type="password"
            value={settings.api.alphaVantageKey}
            onChange={(e) => updateSetting('api', 'alphaVantageKey', e.target.value)}
            className="w-full bg-[#1c1f26] border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-[#3bc9f4] focus:outline-none"
            placeholder="Enter Alpha Vantage API key"
          />
        </div>
      </div>
      
      <div className="bg-[#1c1f26] border border-gray-600 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">API Key Security</h4>
        <p className="text-gray-400 text-sm mb-3">
          All API keys are encrypted and stored securely. They are only used for trading operations and are never shared with third parties.
        </p>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg transition-colors text-sm">
            Clear All Keys
          </button>
          <button className="px-4 py-2 bg-[#3bc9f4] hover:bg-[#2ea3d4] text-white rounded-lg transition-colors text-sm">
            Test Connections
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'trading':
        return renderTradingSettings();
      case 'display':
        return renderDisplaySettings();
      case 'account':
        return renderAccountSettings();
      case 'api':
        return renderApiSettings();
      default:
        return renderTradingSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-[#3bc9f4]" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={resetSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          
          <button
            onClick={saveSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-[#3bc9f4] hover:bg-[#2ea3d4] text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div className="bg-[#0e1117] rounded-lg p-6 border border-gray-700/50">
        {renderContent()}
      </div>
      
      {/* Currency Converter Tool */}
      {activeTab === 'display' && (
        <div className="mt-6">
          <CurrencyConverter />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;