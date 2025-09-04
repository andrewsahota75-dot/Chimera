import { PrismaClient } from '@prisma/client';

interface DatabaseConfig {
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  enableLogging: boolean;
}

interface DatabaseStats {
  activeConnections: number;
  totalQueries: number;
  avgQueryTime: number;
  slowQueries: number;
  errors: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  private config: DatabaseConfig;
  private stats: DatabaseStats = {
    activeConnections: 0,
    totalQueries: 0,
    avgQueryTime: 0,
    slowQueries: 0,
    errors: 0
  };
  private queryTimes: number[] = [];
  private isConnected: boolean = false;

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000'),
      enableLogging: process.env.NODE_ENV === 'development',
      ...config
    };

    this.initializePrisma();
  }

  static getInstance(config?: Partial<DatabaseConfig>): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(config);
    }
    return DatabaseService.instance;
  }

  private initializePrisma(): void {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: this.config.enableLogging ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    // Add query performance monitoring
    this.prisma.$use(async (params, next) => {
      const startTime = Date.now();
      this.stats.activeConnections++;
      
      try {
        const result = await next(params);
        const duration = Date.now() - startTime;
        
        this.updateQueryStats(duration);
        
        if (duration > 1000) { // Log slow queries
          console.warn(`🐌 Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
          this.stats.slowQueries++;
        }
        
        return result;
      } catch (error) {
        this.stats.errors++;
        console.error(`❌ Database error in ${params.model}.${params.action}:`, error);
        throw error;
      } finally {
        this.stats.activeConnections--;
      }
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      
      // Run health check
      await this.healthCheck();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('📴 Database disconnected');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }

  // Trading-specific database operations
  async saveOrder(orderData: any): Promise<any> {
    try {
      const order = await this.prisma.order.create({
        data: {
          symbol: orderData.symbol,
          side: orderData.side,
          quantity: orderData.quantity,
          price: orderData.price,
          status: orderData.status,
          botName: orderData.botName,
          brokerOrderId: orderData.brokerOrderId
        }
      });
      return order;
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  }

  async updateOrder(orderId: string, updates: any): Promise<any> {
    try {
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: updates
      });
      return order;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async getOrders(filter?: { symbol?: string; status?: string; botName?: string }): Promise<any[]> {
    try {
      const where: any = {};
      
      if (filter?.symbol) where.symbol = filter.symbol;
      if (filter?.status) where.status = filter.status;
      if (filter?.botName) where.botName = filter.botName;

      const orders = await this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit to prevent large queries
      });
      
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async saveTrade(tradeData: any): Promise<any> {
    try {
      const trade = await this.prisma.trade.create({
        data: {
          symbol: tradeData.symbol,
          side: tradeData.side,
          quantity: tradeData.quantity,
          price: tradeData.price,
          pnl: tradeData.pnl || 0,
          botName: tradeData.botName,
          orderId: tradeData.orderId
        }
      });
      return trade;
    } catch (error) {
      console.error('Error saving trade:', error);
      throw error;
    }
  }

  async getTrades(filter?: { symbol?: string; botName?: string }): Promise<any[]> {
    try {
      const where: any = {};
      
      if (filter?.symbol) where.symbol = filter.symbol;
      if (filter?.botName) where.botName = filter.botName;

      const trades = await this.prisma.trade.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      
      return trades;
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }

  async savePosition(positionData: any): Promise<any> {
    try {
      const position = await this.prisma.position.upsert({
        where: {
          symbol_botName: {
            symbol: positionData.symbol,
            botName: positionData.botName || ''
          }
        },
        update: {
          quantity: positionData.quantity,
          avgPrice: positionData.avgPrice,
          currentPrice: positionData.currentPrice,
          pnl: positionData.pnl,
          dayChange: positionData.dayChange,
          dayChangePercent: positionData.dayChangePercent
        },
        create: positionData
      });
      return position;
    } catch (error) {
      console.error('Error saving position:', error);
      throw error;
    }
  }

  async getPositions(): Promise<any[]> {
    try {
      const positions = await this.prisma.position.findMany({
        where: {
          quantity: {
            gt: 0 // Only active positions
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return positions;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  // Strategy and configuration management
  async saveStrategyConfig(configData: any): Promise<any> {
    try {
      const config = await this.prisma.strategyConfiguration.upsert({
        where: { id: configData.id },
        update: {
          parameters: configData.parameters,
          isActive: configData.isActive
        },
        create: configData
      });
      return config;
    } catch (error) {
      console.error('Error saving strategy config:', error);
      throw error;
    }
  }

  async getStrategyConfigs(botName?: string): Promise<any[]> {
    try {
      const where = botName ? { botName } : {};
      const configs = await this.prisma.strategyConfiguration.findMany({
        where,
        include: {
          backtestResult: true
        }
      });
      return configs;
    } catch (error) {
      console.error('Error fetching strategy configs:', error);
      throw error;
    }
  }

  // Logging and audit trail
  async saveLog(logData: any): Promise<any> {
    try {
      const log = await this.prisma.alertLog.create({
        data: {
          message: logData.message,
          level: logData.level,
          service: logData.service,
          timestamp: logData.timestamp || new Date()
        }
      });
      return log;
    } catch (error) {
      console.error('Error saving log:', error);
      // Don't throw here to prevent logging errors from breaking the app
    }
  }

  async getLogs(filter?: { level?: string; service?: string; limit?: number }): Promise<any[]> {
    try {
      const where: any = {};
      if (filter?.level) where.level = filter.level;
      if (filter?.service) where.service = filter.service;

      const logs = await this.prisma.alertLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filter?.limit || 100
      });
      
      return logs;
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  // System heartbeat
  async updateHeartbeat(serviceName: string, status: string, metadata?: any): Promise<void> {
    try {
      await this.prisma.heartbeat.upsert({
        where: { service: serviceName },
        update: {
          timestamp: new Date(),
          status,
          metadata: metadata || {}
        },
        create: {
          service: serviceName,
          timestamp: new Date(),
          status,
          metadata: metadata || {}
        }
      });
    } catch (error) {
      console.error(`Error updating heartbeat for ${serviceName}:`, error);
    }
  }

  async getServiceHealth(): Promise<any[]> {
    try {
      const heartbeats = await this.prisma.heartbeat.findMany({
        orderBy: { timestamp: 'desc' }
      });
      return heartbeats;
    } catch (error) {
      console.error('Error fetching service health:', error);
      return [];
    }
  }

  // Performance and maintenance
  async optimizeDatabase(): Promise<void> {
    try {
      console.log('🔧 Starting database optimization...');
      
      // Clean old logs (keep last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedLogs = await this.prisma.alertLog.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo
          }
        }
      });
      
      console.log(`🗑️ Cleaned ${deletedLogs.count} old log entries`);
      
      // Update database statistics
      await this.prisma.$executeRaw`ANALYZE`;
      console.log('📊 Database statistics updated');
      
    } catch (error) {
      console.error('Error optimizing database:', error);
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      const queryTime = Date.now() - startTime;
      
      // Check for recent errors
      const recentErrors = this.stats.errors;
      const avgQueryTime = this.stats.avgQueryTime;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (queryTime > 1000 || avgQueryTime > 500 || recentErrors > 10) {
        status = 'degraded';
      }
      
      if (queryTime > 5000 || recentErrors > 50) {
        status = 'unhealthy';
      }
      
      return {
        status,
        details: {
          connected: this.isConnected,
          queryTime,
          stats: this.getStats(),
          config: {
            maxConnections: this.config.maxConnections,
            connectionTimeout: this.config.connectionTimeout
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error.message
        }
      };
    }
  }

  getStats(): DatabaseStats {
    return { ...this.stats };
  }

  private updateQueryStats(duration: number): void {
    this.stats.totalQueries++;
    this.queryTimes.push(duration);
    
    // Keep only last 100 query times for averaging
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }
    
    this.stats.avgQueryTime = this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length;
  }

  // Raw query execution for complex operations
  async executeRaw(query: string, params?: any[]): Promise<any> {
    try {
      return await this.prisma.$queryRawUnsafe(query, ...(params || []));
    } catch (error) {
      console.error('Raw query error:', error);
      throw error;
    }
  }
}