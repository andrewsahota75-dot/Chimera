import React, { useState } from 'react';
import { 
  User, 
  CreditCard, 
  Shield, 
  Settings,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AccountsPageProps {}

interface Account {
  id: string;
  name: string;
  type: 'broker' | 'exchange' | 'bank';
  provider: string;
  balance: number;
  currency: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: Date;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  created: Date;
  lastUsed: Date | null;
  active: boolean;
}

const AccountsPage: React.FC<AccountsPageProps> = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  
  const [accounts] = useState<Account[]>([
    {
      id: '1',
      name: 'Zerodha Trading Account',
      type: 'broker',
      provider: 'Zerodha',
      balance: 125430.50,
      currency: 'INR',
      status: 'connected',
      lastSync: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Binance Crypto Exchange',
      type: 'exchange',
      provider: 'Binance',
      balance: 5250.75,
      currency: 'USDT',
      status: 'connected',
      lastSync: new Date(Date.now() - 2 * 60 * 1000)
    },
    {
      id: '3',
      name: 'HDFC Bank Account',
      type: 'bank',
      provider: 'HDFC Bank',
      balance: 45000.00,
      currency: 'INR',
      status: 'disconnected',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ]);

  const [apiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Trading Bot API',
      key: 'ck_1234567890abcdef',
      permissions: ['read', 'trade'],
      created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 5 * 60 * 1000),
      active: true
    },
    {
      id: '2',
      name: 'Portfolio Tracker',
      key: 'ck_abcdef1234567890',
      permissions: ['read'],
      created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 60 * 60 * 1000),
      active: true
    },
    {
      id: '3',
      name: 'Legacy Analytics',
      key: 'ck_legacy123456789',
      permissions: ['read'],
      created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      lastUsed: null,
      active: false
    }
  ]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'accounts', label: 'Connected Accounts', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-[#2ecc71]';
      case 'disconnected':
        return 'text-[#f39c12]';
      case 'error':
        return 'text-[#e74c3c]';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-[#2ecc71]" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-[#f39c12]" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#e74c3c]" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleString();
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Info */}
      <div className="bg-[#1c1f26] rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value="Trader"
              readOnly
              className="w-full bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value="trader@example.com"
              readOnly
              className="w-full bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
            <input
              type="text"
              value="January 2024"
              readOnly
              className="w-full bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
            <input
              type="text"
              value="Premium"
              readOnly
              className="w-full bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-[#1c1f26] rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-lg font-medium text-white mb-4">Portfolio Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#2ecc71]">
              {formatCurrency(170680.25, 'INR')}
            </div>
            <div className="text-sm text-gray-400">Total Portfolio Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3bc9f4]">
              {formatCurrency(25430.50, 'INR')}
            </div>
            <div className="text-sm text-gray-400">Total P&L</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f39c12]">
              3
            </div>
            <div className="text-sm text-gray-400">Connected Accounts</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccounts = () => (
    <div className="space-y-4">
      {accounts.map((account) => (
        <div key={account.id} className="bg-[#1c1f26] rounded-lg p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#3bc9f4]/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#3bc9f4]" />
              </div>
              <div>
                <h3 className="text-white font-medium">{account.name}</h3>
                <p className="text-sm text-gray-400">{account.provider}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(account.status)}
              <span className={`text-sm font-medium ${getStatusColor(account.status)}`}>
                {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-lg font-medium text-white">
                {formatCurrency(account.balance, account.currency)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Type</div>
              <div className="text-lg font-medium text-white capitalize">
                {account.type}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Last Sync</div>
              <div className="text-lg font-medium text-white">
                {formatTime(account.lastSync)}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-[#3bc9f4] hover:bg-[#2ea3d4] text-white rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>Sync</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              <span>Configure</span>
            </button>
          </div>
        </div>
      ))}
      
      <button className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-[#3bc9f4] transition-colors">
        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <div className="text-gray-400">Connect New Account</div>
      </button>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="bg-[#1c1f26] rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-lg font-medium text-white mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-gray-400">Add an extra layer of security</div>
            </div>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Session Timeout</div>
              <div className="text-sm text-gray-400">Auto logout after inactivity</div>
            </div>
            <select className="bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-1 text-white">
              <option>60 minutes</option>
              <option>30 minutes</option>
              <option>15 minutes</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Login Notifications</div>
              <div className="text-sm text-gray-400">Get notified of new logins</div>
            </div>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#3bc9f4]">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#1c1f26] rounded-lg p-6 border border-gray-700/50">
        <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              className="w-full bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <button className="bg-[#3bc9f4] hover:bg-[#2ea3d4] text-white px-4 py-2 rounded-lg transition-colors">
            Update Password
          </button>
        </div>
      </div>
    </div>
  );

  const renderApiKeys = () => (
    <div className="space-y-4">
      {apiKeys.map((apiKey) => (
        <div key={apiKey.id} className="bg-[#1c1f26] rounded-lg p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-medium">{apiKey.name}</h3>
              <p className="text-sm text-gray-400">
                Created: {formatTime(apiKey.created)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                apiKey.active 
                  ? 'bg-[#2ecc71]/20 text-[#2ecc71]' 
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {apiKey.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400 mb-1">API Key</div>
              <div className="flex items-center space-x-2">
                <input
                  type={showApiKeys[apiKey.id] ? 'text' : 'password'}
                  value={apiKey.key}
                  readOnly
                  className="flex-1 bg-[#0e1117] border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
                <button
                  onClick={() => toggleApiKeyVisibility(apiKey.id)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {showApiKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(apiKey.key)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-400">Permissions: </span>
                <span className="text-white">{apiKey.permissions.join(', ')}</span>
              </div>
              <div>
                <span className="text-gray-400">Last used: </span>
                <span className="text-white">{formatTime(apiKey.lastUsed)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4">
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
              Regenerate
            </button>
            <button className="px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg transition-colors">
              <Trash2 className="w-4 h-4 inline mr-2" />
              Delete
            </button>
          </div>
        </div>
      ))}
      
      <button className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-[#3bc9f4] transition-colors">
        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <div className="text-gray-400">Create New API Key</div>
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'accounts':
        return renderAccounts();
      case 'security':
        return renderSecurity();
      case 'api':
        return renderApiKeys();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <User className="w-6 h-6 text-[#3bc9f4]" />
        <h1 className="text-2xl font-bold text-white">Account Management</h1>
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
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AccountsPage;