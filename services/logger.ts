export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  service: string;
  category: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  traceId?: string;
}

export interface LogFilter {
  level?: LogLevel;
  service?: string;
  category?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogSize: number = 10000; // Keep last 10k logs in memory
  private logListeners: ((log: LogEntry) => void)[] = [];
  private persistentStorage: boolean = true;
  private currentSessionId: string;

  constructor() {
    this.currentSessionId = this.generateId();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Core logging methods
  debug(message: string, service: string = 'SYSTEM', category: string = 'GENERAL', metadata?: Record<string, any>): void {
    this.log('DEBUG', service, category, message, metadata);
  }

  info(message: string, service: string = 'SYSTEM', category: string = 'GENERAL', metadata?: Record<string, any>): void {
    this.log('INFO', service, category, message, metadata);
  }

  warn(message: string, service: string = 'SYSTEM', category: string = 'GENERAL', metadata?: Record<string, any>): void {
    this.log('WARN', service, category, message, metadata);
  }

  error(message: string, service: string = 'SYSTEM', category: string = 'GENERAL', metadata?: Record<string, any>): void {
    this.log('ERROR', service, category, message, metadata);
  }

  critical(message: string, service: string = 'SYSTEM', category: string = 'GENERAL', metadata?: Record<string, any>): void {
    this.log('CRITICAL', service, category, message, metadata);
  }

  // Trading-specific logging methods
  tradeExecuted(trade: { symbol: string; side: string; quantity: number; price: number; orderId?: string }): void {
    this.info(
      `Trade executed: ${trade.side} ${trade.quantity} ${trade.symbol} @ ${trade.price}`,
      'TRADING',
      'EXECUTION',
      trade
    );
  }

  orderPlaced(order: { id: string; symbol: string; side: string; quantity: number; price: number }): void {
    this.info(
      `Order placed: ${order.side} ${order.quantity} ${order.symbol} @ ${order.price}`,
      'TRADING',
      'ORDER',
      order
    );
  }

  riskViolation(violation: string, metadata?: Record<string, any>): void {
    this.warn(`Risk violation: ${violation}`, 'RISK', 'VIOLATION', metadata);
  }

  strategySignal(signal: { strategy: string; action: string; symbol: string; strength: number }): void {
    this.info(
      `Strategy signal: ${signal.strategy} - ${signal.action} ${signal.symbol} (${signal.strength}%)`,
      'STRATEGY',
      'SIGNAL',
      signal
    );
  }

  systemEvent(event: string, metadata?: Record<string, any>): void {
    this.info(`System event: ${event}`, 'SYSTEM', 'EVENT', metadata);
  }

  // Core logging function
  private log(level: LogLevel, service: string, category: string, message: string, metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      service,
      category,
      message,
      metadata,
      sessionId: this.currentSessionId,
      traceId: this.generateTraceId()
    };

    // Add to memory
    this.logs.unshift(logEntry);
    
    // Maintain max size
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(0, this.maxLogSize);
    }

    // Console output with colors
    this.outputToConsole(logEntry);

    // Notify listeners (for real-time UI updates)
    this.notifyListeners(logEntry);

    // Persist if enabled
    if (this.persistentStorage) {
      this.persistLog(logEntry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level}] [${entry.service}/${entry.category}]`;
    const message = `${prefix} ${entry.message}`;
    
    // Add colors based on log level
    switch (entry.level) {
      case 'DEBUG':
        console.debug(`\x1b[36m${message}\x1b[0m`); // Cyan
        break;
      case 'INFO':
        console.info(`\x1b[32m${message}\x1b[0m`); // Green
        break;
      case 'WARN':
        console.warn(`\x1b[33m${message}\x1b[0m`); // Yellow
        break;
      case 'ERROR':
        console.error(`\x1b[31m${message}\x1b[0m`); // Red
        break;
      case 'CRITICAL':
        console.error(`\x1b[41m\x1b[37m${message}\x1b[0m`); // Red background, white text
        break;
      default:
        console.log(message);
    }

    // Log metadata if present
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log(`\x1b[37m  Metadata: ${JSON.stringify(entry.metadata, null, 2)}\x1b[0m`);
    }
  }

  // Query and filtering
  getLogs(filter?: LogFilter): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        const levelPriority = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, CRITICAL: 4 };
        const minPriority = levelPriority[filter.level];
        filteredLogs = filteredLogs.filter(log => levelPriority[log.level] >= minPriority);
      }

      if (filter.service) {
        filteredLogs = filteredLogs.filter(log => log.service === filter.service);
      }

      if (filter.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filter.category);
      }

      if (filter.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!);
      }

      if (filter.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!);
      }

      if (filter.offset) {
        filteredLogs = filteredLogs.slice(filter.offset);
      }

      if (filter.limit) {
        filteredLogs = filteredLogs.slice(0, filter.limit);
      }
    }

    return filteredLogs;
  }

  // Statistics
  getLogStats(): {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByService: Record<string, number>;
    recentErrors: number;
    systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  } {
    const stats = {
      totalLogs: this.logs.length,
      logsByLevel: { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0, CRITICAL: 0 },
      logsByService: {} as Record<string, number>,
      recentErrors: 0,
      systemHealth: 'HEALTHY' as 'HEALTHY' | 'WARNING' | 'CRITICAL'
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.logs.forEach(log => {
      stats.logsByLevel[log.level]++;
      stats.logsByService[log.service] = (stats.logsByService[log.service] || 0) + 1;
      
      if (log.timestamp > oneHourAgo && (log.level === 'ERROR' || log.level === 'CRITICAL')) {
        stats.recentErrors++;
      }
    });

    // Determine system health
    if (stats.logsByLevel.CRITICAL > 0 || stats.recentErrors > 10) {
      stats.systemHealth = 'CRITICAL';
    } else if (stats.logsByLevel.ERROR > 5 || stats.recentErrors > 5) {
      stats.systemHealth = 'WARNING';
    }

    return stats;
  }

  // Real-time updates
  onLogEntry(callback: (log: LogEntry) => void): void {
    this.logListeners.push(callback);
  }

  offLogEntry(callback: (log: LogEntry) => void): void {
    this.logListeners = this.logListeners.filter(listener => listener !== callback);
  }

  private notifyListeners(log: LogEntry): void {
    this.logListeners.forEach(listener => {
      try {
        listener(log);
      } catch (error) {
        console.error('Error in log listener:', error);
      }
    });
  }

  // Export/Import
  exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  exportLogsAsCSV(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    const headers = ['Timestamp', 'Level', 'Service', 'Category', 'Message', 'Metadata'];
    const csvData = logs.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.service,
      log.category,
      log.message.replace(/"/g, '""'), // Escape quotes
      JSON.stringify(log.metadata || {}).replace(/"/g, '""')
    ]);
    
    return [headers, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  // Configuration
  setMaxLogSize(size: number): void {
    this.maxLogSize = size;
    if (this.logs.length > size) {
      this.logs = this.logs.slice(0, size);
    }
  }

  setPersistentStorage(enabled: boolean): void {
    this.persistentStorage = enabled;
  }

  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared', 'SYSTEM', 'MAINTENANCE');
  }

  // Helper methods
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substr(2, 12);
  }

  private persistLog(entry: LogEntry): void {
    // In a real implementation, this would save to database
    // For now, we just keep in memory
    // Could implement file logging, database logging, or external services like ELK stack
  }

  // Advanced features
  createLogContext(service: string, category?: string): LoggerContext {
    return new LoggerContext(this, service, category || 'GENERAL');
  }

  // Log analysis
  findAnomalies(): LogEntry[] {
    // Simple anomaly detection - find critical errors or unusual patterns
    const recentLogs = this.logs.slice(0, 1000); // Last 1000 logs
    const anomalies: LogEntry[] = [];

    // Find critical errors
    anomalies.push(...recentLogs.filter(log => log.level === 'CRITICAL'));

    // Find repeated errors (same message appearing frequently)
    const errorMessages = new Map<string, number>();
    recentLogs.filter(log => log.level === 'ERROR').forEach(log => {
      const count = errorMessages.get(log.message) || 0;
      errorMessages.set(log.message, count + 1);
    });

    errorMessages.forEach((count, message) => {
      if (count >= 5) { // Repeated 5+ times
        const repeatedError = recentLogs.find(log => log.message === message && log.level === 'ERROR');
        if (repeatedError) {
          anomalies.push(repeatedError);
        }
      }
    });

    return anomalies;
  }
}

// Logger context for scoped logging
export class LoggerContext {
  constructor(
    private logger: Logger,
    private service: string,
    private category: string
  ) {}

  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, this.service, this.category, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, this.service, this.category, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, this.service, this.category, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.logger.error(message, this.service, this.category, metadata);
  }

  critical(message: string, metadata?: Record<string, any>): void {
    this.logger.critical(message, this.service, this.category, metadata);
  }
}

// Export singleton
export default Logger.getInstance();