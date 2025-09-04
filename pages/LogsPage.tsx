
import React, { useState } from 'react';
import { Filter, Download, Search } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: string;
  message: string;
}

export default function LogsPage() {
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock log data
  const logs: LogEntry[] = [
    { id: '1', timestamp: new Date(), level: 'INFO', category: 'TRADING', message: 'Order executed: BUY 100 AAPL at $155.30' },
    { id: '2', timestamp: new Date(Date.now() - 60000), level: 'WARN', category: 'RISK', message: 'Position size approaching risk limit for GOOGL' },
    { id: '3', timestamp: new Date(Date.now() - 120000), level: 'ERROR', category: 'BROKER', message: 'Connection timeout to broker API' },
    { id: '4', timestamp: new Date(Date.now() - 180000), level: 'INFO', category: 'STRATEGY', message: 'Moving average crossover signal detected for MSFT' },
    { id: '5', timestamp: new Date(Date.now() - 240000), level: 'DEBUG', category: 'DATA', message: 'Market data received for 50 symbols' }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-[#3bc9f4]';
      case 'WARN': return 'text-yellow-500';
      case 'ERROR': return 'text-[#e74c3c]';
      case 'DEBUG': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'INFO': return 'bg-[#3bc9f4]/20';
      case 'WARN': return 'bg-yellow-500/20';
      case 'ERROR': return 'bg-[#e74c3c]/20';
      case 'DEBUG': return 'bg-gray-500/20';
      default: return 'bg-gray-600/20';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">System Logs</h1>
        <button className="flex items-center space-x-2 bg-[#3bc9f4] text-white px-4 py-2 rounded-lg hover:bg-[#3bc9f4]/80 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-[#0e1117] text-white px-3 py-1 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
            >
              <option value="ALL">All Levels</option>
              <option value="ERROR">Errors</option>
              <option value="WARN">Warnings</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-[#0e1117] text-white px-3 py-1 rounded border border-gray-600 focus:border-[#3bc9f4] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-[#1c1f26] rounded-lg border border-gray-700/50">
        <div className="p-4 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Log Entries ({filteredLogs.length})</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start space-x-4 p-4 border-b border-gray-700/30 hover:bg-gray-700/20">
              <div className="flex-shrink-0">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getLevelBg(log.level)} ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-white">{log.category}</span>
                  <span className="text-xs text-gray-400">{log.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-gray-300 font-mono">{log.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
