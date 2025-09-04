
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Activity,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useRealTimeUpdates } from './hooks/useRealTimeUpdates';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PositionsTable from './components/PositionsTable';
import BotsStatusPanel from './components/BotsStatusPanel';
import AnalyticsPage from './apps/terminal-ui/src/pages/AnalyticsPage';
import StrategiesPage from './apps/terminal-ui/src/pages/StrategiesPage';
import BacktestingPage from './pages/BacktestingPage';
import LogsPage from './pages/LogsPage';
import PortfolioOverviewPage from './pages/PortfolioOverviewPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import AccountsPage from './pages/AccountsPage';
import { useBotStore } from './apps/terminal-ui/src/store/botStore';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  sparklineData?: number[];
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const currentTime = useRealTimeUpdates(1000);
  const botStore = useBotStore();

  // Mock portfolio data - replace with real API calls
  const [portfolioStats, setPortfolioStats] = useState<StatCard[]>([
    {
      title: 'Portfolio Value',
      value: '$124,567.89',
      change: '+2.34%',
      changeType: 'positive',
      icon: DollarSign,
      sparklineData: [100, 102, 98, 105, 110, 108, 124]
    },
    {
      title: 'Unrealized P&L',
      value: '$3,245.67',
      change: '+5.67%',
      changeType: 'positive',
      icon: TrendingUp,
      sparklineData: [0, 500, 1200, 800, 2100, 2800, 3245]
    },
    {
      title: 'Daily Change',
      value: '+1.89%',
      change: '$2,156.78',
      changeType: 'positive',
      icon: Activity,
      sparklineData: [0, 0.5, 1.2, 0.8, 1.5, 1.9, 1.89]
    },
    {
      title: 'Buying Power',
      value: '$45,332.11',
      change: 'Available',
      changeType: 'neutral',
      icon: Zap,
      sparklineData: [50000, 48000, 47000, 46000, 45500, 45400, 45332]
    }
  ]);

  const refreshData = () => {
    setLastUpdated(new Date());
    // Simulate data refresh by updating bot store
    botStore.updatePortfolioStats({
      totalValue: botStore.portfolioStats.totalValue + (Math.random() - 0.5) * 1000,
      dayChange: (Math.random() - 0.5) * 500
    });
    
    // Trigger re-render of portfolio stats
    setPortfolioStats(prev => prev.map(stat => {
      if (stat.title === 'Portfolio Value') {
        const newValue = botStore.portfolioStats.totalValue;
        return {
          ...stat,
          value: `$${newValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: botStore.portfolioStats.dayChange > 0 ? `+${(Math.random() * 3).toFixed(2)}%` : `-${(Math.random() * 2).toFixed(2)}%`,
          changeType: botStore.portfolioStats.dayChange > 0 ? 'positive' : 'negative'
        };
      }
      return stat;
    }));
  };

  const renderContent = () => {
    switch (activePage) {
      case 'analytics':
        return <AnalyticsPage />;
      case 'strategies':
        return <StrategiesPage />;
      case 'backtesting':
        return <BacktestingPage />;
      case 'logs':
        return <LogsPage />;
      case 'portfolio':
        return <PortfolioOverviewPage />;
      case 'settings':
        return <SettingsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'accounts':
        return <AccountsPage />;
      default:
        return (
          <div className="space-y-6">
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-[#1c1f26] p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#2ecc71] rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-white">Live Trading</span>
                </div>
                <div className="text-sm text-gray-400">
                  Current time: {currentTime.toLocaleTimeString()} | Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={refreshData}
                className="flex items-center space-x-2 px-3 py-1.5 bg-[#3bc9f4]/20 text-[#3bc9f4] rounded-lg hover:bg-[#3bc9f4]/30 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Refresh</span>
              </button>
            </div>

            {/* Portfolio Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {portfolioStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-[#1c1f26] p-6 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-[#3bc9f4]/20 rounded-lg">
                        <Icon className="w-5 h-5 text-[#3bc9f4]" />
                      </div>
                      {stat.sparklineData && (
                        <div className="w-16 h-8">
                          <svg className="w-full h-full" viewBox="0 0 64 32">
                            <polyline
                              points={stat.sparklineData
                                .map((val, i) => `${(i * 64) / (stat.sparklineData!.length - 1)},${32 - (val / Math.max(...stat.sparklineData!) * 28)}`)
                                .join(' ')}
                              fill="none"
                              stroke="#3bc9f4"
                              strokeWidth="1.5"
                              className="opacity-60"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-white mb-2 font-mono">{stat.value}</p>
                      <p className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-[#2ecc71]' :
                        stat.changeType === 'negative' ? 'text-[#e74c3c]' : 'text-gray-400'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Content Grid */}
            <div className="space-y-6">
              {/* Bots Status Panel */}
              <BotsStatusPanel bots={botStore.bots} />
              
              {/* Positions Table */}
              <PositionsTable />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#0e1117] text-white font-sans">
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        botStore={botStore} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNavigate={setActivePage} />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
