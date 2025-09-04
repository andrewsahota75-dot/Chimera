import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import logger from './logger.js';
import cacheService from './cacheService.js';

const prisma = new PrismaClient();

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details: Record<string, any>;
  timestamp: Date;
}

export interface ServiceMetric {
  service: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface AlertRule {
  id: string;
  service: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldownMs: number;
  lastTriggered?: Date;
}

export interface SystemAlert {
  id: string;
  ruleId: string;
  service: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export class HealthMonitor extends EventEmitter {
  private static instance: HealthMonitor;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: ServiceMetric[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, SystemAlert> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor() {
    super();
    this.setupDefaultAlertRules();
  }

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  // Start health monitoring
  start(intervalMs: number = 30000): void {
    if (this.isRunning) {
      logger.warn('Health monitor already running', 'HEALTH_MONITOR', 'START');
      return;
    }

    this.isRunning = true;

    // Health check interval
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);

    // Metrics collection interval
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 10000); // Collect metrics every 10 seconds

    logger.info('Health monitoring started', 'HEALTH_MONITOR', 'START', { intervalMs });
    this.emit('started');
  }

  // Stop health monitoring
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    logger.info('Health monitoring stopped', 'HEALTH_MONITOR', 'STOP');
    this.emit('stopped');
  }

  // Perform all health checks
  private async performHealthChecks(): Promise<void> {
    const checks = [
      this.checkDatabase(),
      this.checkCache(),
      this.checkMemoryUsage(),
      this.checkDiskUsage(),
      this.checkApiHealth()
    ];

    const results = await Promise.allSettled(checks);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error('Health check failed', 'HEALTH_MONITOR', 'CHECK_ERROR', {
          checkIndex: index,
          error: result.reason
        });
      }
    });

    // Process metrics and check alert rules
    this.processMetricsForAlerts();
  }

  // Database health check
  private async checkDatabase(): Promise<void> {
    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      const healthCheck: HealthCheck = {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : responseTime < 5000 ? 'degraded' : 'unhealthy',
        responseTime,
        details: { 
          connectionPool: 'active',
          queryTime: `${responseTime}ms`
        },
        timestamp: new Date()
      };

      this.healthChecks.set('database', healthCheck);
      this.recordMetric('database', 'response_time', responseTime, 'ms');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck: HealthCheck = {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      };

      this.healthChecks.set('database', healthCheck);
      logger.error('Database health check failed', 'HEALTH_MONITOR', 'DB_CHECK', { error });
    }
  }

  // Cache health check
  private async checkCache(): Promise<void> {
    const startTime = Date.now();
    try {
      const healthResult = await cacheService.healthCheck();
      const responseTime = Date.now() - startTime;

      const healthCheck: HealthCheck = {
        service: 'cache',
        status: healthResult.status === 'healthy' ? 'healthy' : 
               healthResult.status === 'degraded' ? 'degraded' : 'unhealthy',
        responseTime,
        details: healthResult.details,
        timestamp: new Date()
      };

      this.healthChecks.set('cache', healthCheck);
      this.recordMetric('cache', 'response_time', responseTime, 'ms');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck: HealthCheck = {
        service: 'cache',
        status: 'unhealthy',
        responseTime,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      };

      this.healthChecks.set('cache', healthCheck);
      logger.error('Cache health check failed', 'HEALTH_MONITOR', 'CACHE_CHECK', { error });
    }
  }

  // Memory usage check
  private async checkMemoryUsage(): Promise<void> {
    try {
      const memUsage = process.memoryUsage();
      const totalMB = memUsage.heapTotal / 1024 / 1024;
      const usedMB = memUsage.heapUsed / 1024 / 1024;
      const usagePercent = (usedMB / totalMB) * 100;

      const healthCheck: HealthCheck = {
        service: 'memory',
        status: usagePercent < 70 ? 'healthy' : usagePercent < 85 ? 'degraded' : 'unhealthy',
        responseTime: 0,
        details: {
          heapUsed: `${usedMB.toFixed(2)}MB`,
          heapTotal: `${totalMB.toFixed(2)}MB`,
          usagePercent: `${usagePercent.toFixed(2)}%`,
          external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`
        },
        timestamp: new Date()
      };

      this.healthChecks.set('memory', healthCheck);
      this.recordMetric('memory', 'heap_used', usedMB, 'MB');
      this.recordMetric('memory', 'usage_percent', usagePercent, '%');

    } catch (error) {
      logger.error('Memory usage check failed', 'HEALTH_MONITOR', 'MEMORY_CHECK', { error });
    }
  }

  // Disk usage check
  private async checkDiskUsage(): Promise<void> {
    try {
      // Simple disk usage check (would need proper implementation)
      const healthCheck: HealthCheck = {
        service: 'disk',
        status: 'healthy', // Simplified
        responseTime: 0,
        details: { 
          available: 'N/A',
          used: 'N/A',
          note: 'Disk monitoring not fully implemented'
        },
        timestamp: new Date()
      };

      this.healthChecks.set('disk', healthCheck);
    } catch (error) {
      logger.error('Disk usage check failed', 'HEALTH_MONITOR', 'DISK_CHECK', { error });
    }
  }

  // API health check
  private async checkApiHealth(): Promise<void> {
    const startTime = Date.now();
    try {
      // Simple API health check
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        service: 'api',
        status: 'healthy',
        responseTime,
        details: {
          port: process.env.API_PORT || 3001,
          uptime: process.uptime(),
          version: '1.0.0'
        },
        timestamp: new Date()
      };

      this.healthChecks.set('api', healthCheck);
      this.recordMetric('api', 'uptime', process.uptime(), 'seconds');

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const healthCheck: HealthCheck = {
        service: 'api',
        status: 'unhealthy',
        responseTime,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      };

      this.healthChecks.set('api', healthCheck);
      logger.error('API health check failed', 'HEALTH_MONITOR', 'API_CHECK', { error });
    }
  }

  // Collect system metrics
  private collectSystemMetrics(): void {
    try {
      const cpuUsage = process.cpuUsage();
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      // CPU metrics
      this.recordMetric('system', 'cpu_user', cpuUsage.user / 1000, 'ms');
      this.recordMetric('system', 'cpu_system', cpuUsage.system / 1000, 'ms');

      // Memory metrics  
      this.recordMetric('system', 'memory_rss', memUsage.rss / 1024 / 1024, 'MB');
      this.recordMetric('system', 'memory_heap_total', memUsage.heapTotal / 1024 / 1024, 'MB');
      this.recordMetric('system', 'memory_heap_used', memUsage.heapUsed / 1024 / 1024, 'MB');

      // System uptime
      this.recordMetric('system', 'uptime', uptime, 'seconds');

      // Keep only last 1000 metrics to prevent memory issues
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

    } catch (error) {
      logger.error('Error collecting system metrics', 'HEALTH_MONITOR', 'METRICS_ERROR', { error });
    }
  }

  // Record a metric
  recordMetric(service: string, metric: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metricData: ServiceMetric = {
      service,
      metric,
      value,
      unit,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metricData);
    this.emit('metric', metricData);
  }

  // Setup default alert rules
  private setupDefaultAlertRules(): void {
    const rules: Omit<AlertRule, 'id'>[] = [
      {
        service: 'database',
        metric: 'response_time',
        condition: 'greater_than',
        threshold: 5000,
        severity: 'warning',
        enabled: true,
        cooldownMs: 5 * 60 * 1000 // 5 minutes
      },
      {
        service: 'memory',
        metric: 'usage_percent',
        condition: 'greater_than',
        threshold: 85,
        severity: 'critical',
        enabled: true,
        cooldownMs: 2 * 60 * 1000 // 2 minutes
      },
      {
        service: 'cache',
        metric: 'response_time',
        condition: 'greater_than',
        threshold: 1000,
        severity: 'warning',
        enabled: true,
        cooldownMs: 5 * 60 * 1000 // 5 minutes
      }
    ];

    rules.forEach(rule => {
      this.addAlertRule({
        ...rule,
        id: `${rule.service}_${rule.metric}_${rule.condition}_${rule.threshold}`
      });
    });
  }

  // Add alert rule
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info('Alert rule added', 'HEALTH_MONITOR', 'ALERT_RULE', rule);
  }

  // Process metrics for alerts
  private processMetricsForAlerts(): void {
    const now = new Date();
    
    this.alertRules.forEach((rule) => {
      if (!rule.enabled) return;

      // Check cooldown
      if (rule.lastTriggered && (now.getTime() - rule.lastTriggered.getTime()) < rule.cooldownMs) {
        return;
      }

      // Find latest metric value
      const latestMetric = this.metrics
        .filter(m => m.service === rule.service && m.metric === rule.metric)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      if (!latestMetric) return;

      // Check condition
      let shouldTrigger = false;
      switch (rule.condition) {
        case 'greater_than':
          shouldTrigger = latestMetric.value > rule.threshold;
          break;
        case 'less_than':
          shouldTrigger = latestMetric.value < rule.threshold;
          break;
        case 'equals':
          shouldTrigger = latestMetric.value === rule.threshold;
          break;
      }

      if (shouldTrigger) {
        this.triggerAlert(rule, latestMetric);
      }
    });
  }

  // Trigger an alert
  private triggerAlert(rule: AlertRule, metric: ServiceMetric): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: SystemAlert = {
      id: alertId,
      ruleId: rule.id,
      service: rule.service,
      metric: rule.metric,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity,
      message: `${rule.service} ${rule.metric} (${metric.value}${metric.unit}) ${rule.condition.replace('_', ' ')} threshold (${rule.threshold}${metric.unit})`,
      timestamp: new Date(),
      resolved: false
    };

    this.activeAlerts.set(alertId, alert);
    
    // Update rule last triggered
    rule.lastTriggered = new Date();

    // Log alert
    logger[rule.severity === 'critical' ? 'critical' : 'warn'](
      alert.message,
      'HEALTH_MONITOR',
      'ALERT',
      alert
    );

    // Emit alert event
    this.emit('alert', alert);
  }

  // Resolve alert
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    logger.info('Alert resolved', 'HEALTH_MONITOR', 'RESOLVE', { alertId, alert: alert.message });
    this.emit('alertResolved', alert);

    return true;
  }

  // Get current health status
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheck[];
    lastCheck: Date;
  } {
    const services = Array.from(this.healthChecks.values());
    
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (services.some(s => s.status === 'unhealthy')) {
      overall = 'unhealthy';
    } else if (services.some(s => s.status === 'degraded')) {
      overall = 'degraded';
    }

    const lastCheck = services.length > 0 
      ? new Date(Math.max(...services.map(s => s.timestamp.getTime())))
      : new Date();

    return {
      overall,
      services,
      lastCheck
    };
  }

  // Get metrics
  getMetrics(service?: string, metric?: string, limit: number = 100): ServiceMetric[] {
    let filtered = [...this.metrics];

    if (service) {
      filtered = filtered.filter(m => m.service === service);
    }

    if (metric) {
      filtered = filtered.filter(m => m.metric === metric);
    }

    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get active alerts
  getActiveAlerts(): SystemAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get system summary
  getSystemSummary(): {
    status: string;
    uptime: number;
    activeAlerts: number;
    services: Record<string, string>;
    metrics: {
      memoryUsage: number;
      cpuUsage: string;
    };
  } {
    const healthStatus = this.getHealthStatus();
    const activeAlertsCount = this.getActiveAlerts().length;
    
    const services: Record<string, string> = {};
    this.healthChecks.forEach((check, service) => {
      services[service] = check.status;
    });

    const memUsage = process.memoryUsage();
    const memoryUsage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    return {
      status: healthStatus.overall,
      uptime: process.uptime(),
      activeAlerts: activeAlertsCount,
      services,
      metrics: {
        memoryUsage,
        cpuUsage: 'N/A' // Would need proper CPU monitoring
      }
    };
  }
}

export default HealthMonitor.getInstance();