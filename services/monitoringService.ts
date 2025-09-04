import { CacheService } from './cacheService';
import { DatabaseService } from './databaseService';
import cron from 'node-cron';

interface SystemMetrics {
  timestamp: Date;
  cpu: { usage: number; load: number[] };
  memory: { used: number; total: number; percentage: number };
  database: { status: string; avgQueryTime: number; activeConnections: number };
  cache: { status: string; hitRate: number; totalOperations: number };
  trading: { activeOrders: number; totalTrades: number; pnl: number };
  errors: { count: number; criticalCount: number };
}

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    cache: 'healthy' | 'degraded' | 'unhealthy';
    trading: 'healthy' | 'degraded' | 'unhealthy';
    risk: 'healthy' | 'degraded' | 'unhealthy';
  };
  metrics: SystemMetrics;
  alerts: Alert[];
}

interface Alert {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  service: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private healthChecks: Map<string, () => Promise<any>> = new Map();
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private metricsCallbacks: ((metrics: SystemMetrics) => void)[] = [];
  private isMonitoring: boolean = false;
  
  private thresholds = {
    cpu: 80, // CPU usage percentage
    memory: 85, // Memory usage percentage
    queryTime: 1000, // Database query time in ms
    cacheHitRate: 50, // Cache hit rate percentage
    errorRate: 10, // Errors per minute
    criticalErrors: 3 // Critical errors per hour
  };

  constructor() {
    this.registerHealthChecks();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Health check registration
  private registerHealthChecks(): void {
    this.healthChecks.set('database', async () => {
      const db = DatabaseService.getInstance();
      return await db.healthCheck();
    });

    this.healthChecks.set('cache', async () => {
      const cache = CacheService.getInstance();
      return await cache.healthCheck();
    });

    this.healthChecks.set('system', async () => {
      return {
        status: 'healthy',
        details: {
          uptime: process.uptime(),
          version: process.version,
          platform: process.platform
        }
      };
    });
  }

  // Start monitoring
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting system monitoring...');

    // Collect metrics every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('Error collecting metrics:', error);
        this.createAlert('ERROR', 'MONITORING', 'Failed to collect system metrics', { error: error.message });
      }
    });

    // Run full health checks every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
      try {
        await this.runHealthChecks();
      } catch (error) {
        console.error('Error running health checks:', error);
        this.createAlert('ERROR', 'MONITORING', 'Health check failed', { error: error.message });
      }
    });

    // Cleanup old data every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupOldData();
    });

    // Initial metrics collection
    await this.collectMetrics();
    await this.runHealthChecks();
  }

  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    console.log('⏹️ Monitoring stopped');
  }

  // Metrics collection
  private async collectMetrics(): Promise<void> {
    const db = DatabaseService.getInstance();
    const cache = CacheService.getInstance();
    
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: this.getCpuMetrics(),
      memory: this.getMemoryMetrics(),
      database: await this.getDatabaseMetrics(db),
      cache: this.getCacheMetrics(cache),
      trading: await this.getTradingMetrics(),
      errors: this.getErrorMetrics()
    };

    this.metrics.unshift(metrics);
    
    // Keep only last 2880 entries (24 hours at 30s intervals)
    if (this.metrics.length > 2880) {
      this.metrics = this.metrics.slice(0, 2880);
    }

    // Check thresholds and create alerts
    this.checkThresholds(metrics);

    // Notify callbacks
    this.notifyMetricsCallbacks(metrics);
  }

  private getCpuMetrics(): { usage: number; load: number[] } {
    const usage = process.cpuUsage();
    const totalUsage = (usage.user + usage.system) / 1000000; // Convert to seconds
    
    return {
      usage: Math.min(totalUsage * 100, 100), // Rough CPU percentage
      load: process.loadavg ? process.loadavg() : [0, 0, 0]
    };
  }

  private getMemoryMetrics(): { used: number; total: number; percentage: number } {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal + usage.external;
    const usedMemory = usage.heapUsed;
    
    return {
      used: usedMemory,
      total: totalMemory,
      percentage: (usedMemory / totalMemory) * 100
    };
  }

  private async getDatabaseMetrics(db: DatabaseService): Promise<{ status: string; avgQueryTime: number; activeConnections: number }> {
    try {
      const stats = db.getStats();
      const health = await db.healthCheck();
      
      return {
        status: health.status,
        avgQueryTime: stats.avgQueryTime,
        activeConnections: stats.activeConnections
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        avgQueryTime: 0,
        activeConnections: 0
      };
    }
  }

  private getCacheMetrics(cache: CacheService): { status: string; hitRate: number; totalOperations: number } {
    const stats = cache.getStats();
    
    return {
      status: stats.connected ? 'healthy' : 'unhealthy',
      hitRate: stats.hitRate,
      totalOperations: stats.totalOperations
    };
  }

  private async getTradingMetrics(): Promise<{ activeOrders: number; totalTrades: number; pnl: number }> {
    // In a real implementation, this would fetch from the trading services
    return {
      activeOrders: 5, // Mock data
      totalTrades: 150,
      pnl: 2500.75
    };
  }

  private getErrorMetrics(): { count: number; criticalCount: number } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAlerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo);
    
    return {
      count: recentAlerts.length,
      criticalCount: recentAlerts.filter(alert => alert.level === 'CRITICAL').length
    };
  }

  // Threshold monitoring
  private checkThresholds(metrics: SystemMetrics): void {
    // CPU threshold
    if (metrics.cpu.usage > this.thresholds.cpu) {
      this.createAlert('WARN', 'SYSTEM', `High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`, {
        current: metrics.cpu.usage,
        threshold: this.thresholds.cpu
      });
    }

    // Memory threshold
    if (metrics.memory.percentage > this.thresholds.memory) {
      this.createAlert('WARN', 'SYSTEM', `High memory usage: ${metrics.memory.percentage.toFixed(1)}%`, {
        current: metrics.memory.percentage,
        threshold: this.thresholds.memory
      });
    }

    // Database threshold
    if (metrics.database.avgQueryTime > this.thresholds.queryTime) {
      this.createAlert('WARN', 'DATABASE', `Slow database queries: ${metrics.database.avgQueryTime}ms average`, {
        current: metrics.database.avgQueryTime,
        threshold: this.thresholds.queryTime
      });
    }

    // Cache threshold
    if (metrics.cache.hitRate < this.thresholds.cacheHitRate && metrics.cache.totalOperations > 10) {
      this.createAlert('WARN', 'CACHE', `Low cache hit rate: ${metrics.cache.hitRate.toFixed(1)}%`, {
        current: metrics.cache.hitRate,
        threshold: this.thresholds.cacheHitRate
      });
    }

    // Error rate threshold
    if (metrics.errors.count > this.thresholds.errorRate) {
      this.createAlert('ERROR', 'SYSTEM', `High error rate: ${metrics.errors.count} errors in the last hour`, {
        current: metrics.errors.count,
        threshold: this.thresholds.errorRate
      });
    }

    // Critical error threshold
    if (metrics.errors.criticalCount > this.thresholds.criticalErrors) {
      this.createAlert('CRITICAL', 'SYSTEM', `Multiple critical errors: ${metrics.errors.criticalCount} in the last hour`, {
        current: metrics.errors.criticalCount,
        threshold: this.thresholds.criticalErrors
      });
    }
  }

  // Health checks
  private async runHealthChecks(): Promise<void> {
    for (const [service, check] of this.healthChecks) {
      try {
        const result = await check();
        
        if (result.status === 'unhealthy') {
          this.createAlert('ERROR', service.toUpperCase(), `Service unhealthy: ${service}`, result.details);
        } else if (result.status === 'degraded') {
          this.createAlert('WARN', service.toUpperCase(), `Service degraded: ${service}`, result.details);
        }
      } catch (error) {
        this.createAlert('ERROR', service.toUpperCase(), `Health check failed for ${service}`, { error: error.message });
      }
    }
  }

  // Alert management
  private createAlert(level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL', service: string, message: string, metadata?: Record<string, any>): void {
    // Check for duplicate alerts (same service and message in last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const duplicateAlert = this.alerts.find(alert => 
      alert.service === service && 
      alert.message === message && 
      alert.timestamp > tenMinutesAgo &&
      !alert.resolved
    );

    if (duplicateAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      service,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };

    this.alerts.unshift(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(0, 1000);
    }

    // Log alert
    const logLevel = level === 'CRITICAL' ? 'error' : level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info';
    console[logLevel](`🚨 ${level} Alert [${service}]: ${message}`);

    // Notify callbacks
    this.notifyAlertCallbacks(alert);
  }

  // Public methods
  getSystemHealth(): HealthStatus {
    const latestMetrics = this.metrics[0];
    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    const criticalAlerts = activeAlerts.filter(alert => alert.level === 'CRITICAL');
    const errorAlerts = activeAlerts.filter(alert => alert.level === 'ERROR');

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (criticalAlerts.length > 0) {
      overall = 'unhealthy';
    } else if (errorAlerts.length > 2 || activeAlerts.length > 5) {
      overall = 'degraded';
    }

    return {
      overall,
      services: {
        database: this.getServiceStatus('DATABASE'),
        cache: this.getServiceStatus('CACHE'),
        trading: this.getServiceStatus('TRADING'),
        risk: this.getServiceStatus('RISK')
      },
      metrics: latestMetrics || this.getDefaultMetrics(),
      alerts: activeAlerts.slice(0, 10) // Return last 10 alerts
    };
  }

  private getServiceStatus(serviceName: string): 'healthy' | 'degraded' | 'unhealthy' {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentAlerts = this.alerts.filter(alert => 
      alert.service === serviceName && 
      alert.timestamp > fiveMinutesAgo && 
      !alert.resolved
    );

    if (recentAlerts.some(alert => alert.level === 'CRITICAL')) {
      return 'unhealthy';
    } else if (recentAlerts.some(alert => alert.level === 'ERROR') || recentAlerts.length > 2) {
      return 'degraded';
    }
    return 'healthy';
  }

  private getDefaultMetrics(): SystemMetrics {
    return {
      timestamp: new Date(),
      cpu: { usage: 0, load: [0, 0, 0] },
      memory: { used: 0, total: 0, percentage: 0 },
      database: { status: 'unknown', avgQueryTime: 0, activeConnections: 0 },
      cache: { status: 'unknown', hitRate: 0, totalOperations: 0 },
      trading: { activeOrders: 0, totalTrades: 0, pnl: 0 },
      errors: { count: 0, criticalCount: 0 }
    };
  }

  getMetrics(hours: number = 1): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  getAlerts(resolved: boolean = false, limit: number = 50): Alert[] {
    return this.alerts
      .filter(alert => alert.resolved === resolved)
      .slice(0, limit);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  // Event subscriptions
  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  onMetrics(callback: (metrics: SystemMetrics) => void): void {
    this.metricsCallbacks.push(callback);
  }

  private notifyAlertCallbacks(alert: Alert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  private notifyMetricsCallbacks(metrics: SystemMetrics): void {
    this.metricsCallbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in metrics callback:', error);
      }
    });
  }

  // Configuration
  updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('📊 Monitoring thresholds updated:', this.thresholds);
  }

  // Cleanup
  private cleanupOldData(): void {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Clean old resolved alerts
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || alert.timestamp > twentyFourHoursAgo
    );

    console.log('🧹 Cleaned up old monitoring data');
  }

  // Export data for external monitoring systems
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      return this.toPrometheusFormat();
    }
    return JSON.stringify(this.metrics.slice(0, 100), null, 2);
  }

  private toPrometheusFormat(): string {
    const latest = this.metrics[0];
    if (!latest) return '';

    return `
# HELP cpu_usage_percent Current CPU usage percentage
# TYPE cpu_usage_percent gauge
cpu_usage_percent ${latest.cpu.usage}

# HELP memory_usage_percent Current memory usage percentage
# TYPE memory_usage_percent gauge
memory_usage_percent ${latest.memory.percentage}

# HELP database_query_time_ms Average database query time in milliseconds
# TYPE database_query_time_ms gauge
database_query_time_ms ${latest.database.avgQueryTime}

# HELP cache_hit_rate_percent Cache hit rate percentage
# TYPE cache_hit_rate_percent gauge
cache_hit_rate_percent ${latest.cache.hitRate}

# HELP active_orders_count Current number of active orders
# TYPE active_orders_count gauge
active_orders_count ${latest.trading.activeOrders}

# HELP total_pnl Current total profit and loss
# TYPE total_pnl gauge
total_pnl ${latest.trading.pnl}
`.trim();
  }
}