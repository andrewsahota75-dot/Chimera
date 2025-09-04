
import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Settings, 
  FileText, 
  Target,
  ChevronLeft,
  ChevronRight,
  Activity,
  PieChart,
  Bell,
  User,
  AlertTriangle
} from 'lucide-react';
import { BotStatus } from '../types';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  botStore: any;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
}

const navSections: NavSection[] = [
  {
    title: 'Core',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'portfolio', label: 'Portfolio', icon: PieChart }
    ]
  },
  {
    title: 'Trading',
    items: [
      { id: 'strategies', label: 'Strategies', icon: Target }
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'logs', label: 'Logs', icon: FileText },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: '3' },
      { id: 'accounts', label: 'Accounts', icon: User }
    ]
  }
];

export default function Sidebar({ activePage, onNavigate, botStore }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Core', 'Trading', 'System']));
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  };

  const { bots, portfolioStats } = botStore;
  const isSystemOnline = bots.some((bot: BotStatus) => bot.status === 'running');
  
  const handleKillSwitch = () => {
    if (killSwitchActive) return;
    
    setKillSwitchActive(true);
    // In a real app, this would trigger backend API calls to:
    // 1. Close all positions
    // 2. Stop all strategies
    // 3. Prevent new position entries
    console.log('KILL SWITCH ACTIVATED: Closing all positions and stopping strategies');
    
    // Reset kill switch after 5 seconds for demo
    setTimeout(() => setKillSwitchActive(false), 5000);
  };
  
  // Auto-trigger kill switch if portfolio drops 10% in a day
  React.useEffect(() => {
    if (portfolioStats?.dayChangePercent && portfolioStats.dayChangePercent <= -10) {
      console.log('Auto-triggering kill switch due to 10% portfolio drop');
      handleKillSwitch();
    }
  }, [portfolioStats?.dayChangePercent]);

  return (
    <div className={`bg-[#1c1f26] h-full transition-all duration-300 flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">Chimera</h1>
              <p className="text-xs text-gray-400">Trading Terminal</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Trading Status */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-700/50">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide">Trading Status</label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white">Equity</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      bots.filter(bot => bot.name.includes('Equity')).some(bot => bot.status === 'running') 
                        ? 'bg-[#2ecc71]' : 'bg-[#e74c3c]'
                    }`} />
                    <span className="text-xs font-medium text-white">
                      {bots.filter(bot => bot.name.includes('Equity')).some(bot => bot.status === 'running') ? 'Active' : 'Stopped'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white">Crypto</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      bots.filter(bot => bot.name.includes('Crypto')).some(bot => bot.status === 'running') 
                        ? 'bg-[#2ecc71]' : 'bg-[#e74c3c]'
                    }`} />
                    <span className="text-xs font-medium text-white">
                      {bots.filter(bot => bot.name.includes('Crypto')).some(bot => bot.status === 'running') ? 'Active' : 'Stopped'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="py-2">
            {!isCollapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase text-gray-400 hover:text-white transition-colors"
              >
                {section.title}
                <ChevronRight className={`w-3 h-3 transition-transform ${
                  expandedSections.has(section.title) ? 'rotate-90' : ''
                }`} />
              </button>
            )}
            
            {(isCollapsed || expandedSections.has(section.title)) && (
              <div className="space-y-1 px-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-[#3bc9f4]/20 text-[#3bc9f4] shadow-lg'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#3bc9f4]' : ''}`} />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-[#e74c3c] text-white text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700/50 space-y-3">
          <div className="flex items-center space-x-2">
            <Activity className={`w-4 h-4 ${isSystemOnline ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`} />
            <span className="text-xs text-gray-400">
              System {isSystemOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {/* Kill Switch */}
          <button
            onClick={handleKillSwitch}
            disabled={killSwitchActive}
            className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              killSwitchActive
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-[#e74c3c] hover:bg-[#c0392b] text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">
              {killSwitchActive ? 'ACTIVATED' : 'KILL SWITCH'}
            </span>
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Exits all positions & stops strategies
          </p>
        </div>
      )}
    </div>
  );
}
