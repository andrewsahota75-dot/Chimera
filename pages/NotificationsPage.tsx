import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info,
  Trash2,
  Check,
  Settings as SettingsIcon,
  Filter
} from 'lucide-react';

interface NotificationsPageProps {}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  category: 'trading' | 'system' | 'account' | 'market';
}

const NotificationsPage: React.FC<NotificationsPageProps> = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'trading' | 'system' | 'account' | 'market'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Trade Executed',
      message: 'Successfully bought 100 shares of RELIANCE at ₹2,450.50',
      type: 'success',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      category: 'trading'
    },
    {
      id: '2',
      title: 'Risk Alert',
      message: 'Portfolio risk exceeded 15% threshold. Consider reducing position size.',
      type: 'warning',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
      category: 'trading'
    },
    {
      id: '3',
      title: 'Market Update',
      message: 'NIFTY50 closed 1.2% higher at 18,245.60',
      type: 'info',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      category: 'market'
    },
    {
      id: '4',
      title: 'Connection Lost',
      message: 'Lost connection to Zerodha broker. Attempting to reconnect...',
      type: 'error',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      read: false,
      category: 'system'
    },
    {
      id: '5',
      title: 'Session Timeout Warning',
      message: 'Your session will expire in 10 minutes. Please save your work.',
      type: 'warning',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true,
      category: 'account'
    },
    {
      id: '6',
      title: 'Strategy Performance',
      message: 'Mean Reversion strategy achieved 8.5% return this week',
      type: 'success',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: true,
      category: 'trading'
    }
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[#2ecc71]" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-[#f39c12]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[#e74c3c]" />;
      default:
        return <Info className="w-5 h-5 text-[#3bc9f4]" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-[#2ecc71]/10 border-[#2ecc71]/30';
      case 'warning':
        return 'bg-[#f39c12]/10 border-[#f39c12]/30';
      case 'error':
        return 'bg-[#e74c3c]/10 border-[#e74c3c]/30';
      default:
        return 'bg-[#3bc9f4]/10 border-[#3bc9f4]/30';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-[#3bc9f4]" />
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-[#e74c3c] text-white text-xs rounded-full px-2 py-1">
              {unreadCount} unread
            </span>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 bg-[#3bc9f4] hover:bg-[#2ea3d4] text-white rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
          
          <button
            onClick={clearAll}
            className="flex items-center space-x-2 px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 bg-[#1c1f26] rounded-lg p-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: 'Unread' },
          { id: 'trading', label: 'Trading' },
          { id: 'system', label: 'System' },
          { id: 'account', label: 'Account' },
          { id: 'market', label: 'Market' }
        ].map((filterOption) => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption.id
                ? 'bg-[#3bc9f4] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications found.`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all ${
                notification.read 
                  ? 'bg-[#0e1117] border-gray-700/50' 
                  : `${getBackgroundColor(notification.type)} border`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`text-sm font-medium ${
                        notification.read ? 'text-gray-300' : 'text-white'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-[#3bc9f4] rounded-full" />
                      )}
                      <span className="text-xs text-gray-500 uppercase">
                        {notification.category}
                      </span>
                    </div>
                    
                    <p className={`text-sm ${
                      notification.read ? 'text-gray-400' : 'text-gray-200'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 text-gray-400 hover:text-[#3bc9f4] transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 text-gray-400 hover:text-[#e74c3c] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-[#1c1f26] rounded-lg p-6 border border-gray-700/50">
        <div className="flex items-center space-x-3 mb-4">
          <SettingsIcon className="w-5 h-5 text-[#3bc9f4]" />
          <h3 className="text-lg font-medium text-white">Notification Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Trading Alerts</span>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#3bc9f4]">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">System Notifications</span>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#3bc9f4]">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Market Updates</span>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Sound Alerts</span>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;