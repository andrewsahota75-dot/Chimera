import { PrismaClient } from '@prisma/client';
import logger from './logger.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

export interface QueryPerformance {
  query: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: Date;
}

export interface DatabaseStats {
  connectionCount: number;
  activeQueries: number;
  slowQueries: number;
  indexHitRatio: number;
  cacheHitRatio: number;
  diskUsage: string;
  lastOptimized: Date;
}

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private queryStats: QueryPerformance[] = [];
  private slowQueryThreshold: number = 1000; // 1 second
  private lastMaintenanceRun?: Date;

  constructor() {
    this.setupQueryLogging();
  }

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  // Apply database indexes and optimizations
  async applyOptimizations(): Promise<void> {
    try {
      logger.info('Applying database optimizations', 'DB_OPTIMIZER', 'OPTIMIZE_START');

      // Apply indexes from migration file
      await this.createIndexes();

      // Update table statistics
      await this.updateTableStatistics();

      // Analyze query plans
      await this.analyzeQueryPlans();

      // Run maintenance tasks
      await this.runMaintenance();

      logger.info('Database optimizations completed', 'DB_OPTIMIZER', 'OPTIMIZE_COMPLETE');
      this.emit('optimizationComplete');

    } catch (error) {
      logger.error('Database optimization failed', 'DB_OPTIMIZER', 'OPTIMIZE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Create database indexes
  private async createIndexes(): Promise<void> {
    try {
      const indexSqlPath = join(process.cwd(), 'prisma', 'migrations', '001_add_indexes.sql');
      const indexSql = readFileSync(indexSqlPath, 'utf8');
      
      // Split by lines and execute each CREATE INDEX statement
      const statements = indexSql.split('\n')
        .filter(line => line.trim().startsWith('CREATE INDEX'))
        .map(line => line.replace(/;$/, ''));

      logger.info(`Executing ${statements.length} index creation statements`, 'DB_OPTIMIZER', 'CREATE_INDEXES');

      for (const statement of statements) {
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          // Index might already exist, log but continue
          logger.warn('Index creation warning', 'DB_OPTIMIZER', 'INDEX_WARNING', {
            statement,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('Database indexes created/updated', 'DB_OPTIMIZER', 'INDEXES_COMPLETE');

    } catch (error) {
      logger.error('Index creation failed', 'DB_OPTIMIZER', 'INDEX_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update table statistics for query optimizer
  private async updateTableStatistics(): Promise<void> {
    try {
      const tables = ['User', 'Position', 'Trade', 'Order', 'StrategyConfiguration', 'BacktestResult', 'Heartbeat', 'AlertLog'];
      
      logger.info('Updating table statistics', 'DB_OPTIMIZER', 'STATS_UPDATE');

      for (const table of tables) {
        try {
          // PostgreSQL ANALYZE command updates statistics
          await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
        } catch (error) {
          logger.warn(`Failed to analyze table ${table}`, 'DB_OPTIMIZER', 'ANALYZE_WARNING', {
            table,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('Table statistics updated', 'DB_OPTIMIZER', 'STATS_COMPLETE');

    } catch (error) {
      logger.error('Table statistics update failed', 'DB_OPTIMIZER', 'STATS_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Analyze common query patterns
  private async analyzeQueryPlans(): Promise<void> {
    try {
      logger.info('Analyzing query execution plans', 'DB_OPTIMIZER', 'QUERY_ANALYSIS');

      const commonQueries = [
        'SELECT * FROM "Position" WHERE "symbol" = $1 ORDER BY "createdAt" DESC LIMIT 10',
        'SELECT * FROM "Trade" WHERE "symbol" = $1 AND "timestamp" >= $2 ORDER BY "timestamp" DESC',
        'SELECT * FROM "Order" WHERE "status" = $1 ORDER BY "createdAt" DESC LIMIT 20',
        'SELECT * FROM "StrategyConfiguration" WHERE "isActive" = true',
        'SELECT COUNT(*) FROM "Trade" WHERE "symbol" = $1 AND "side" = $2'
      ];

      for (const query of commonQueries) {
        try {
          // Get execution plan (PostgreSQL EXPLAIN)
          const plan = await prisma.$queryRawUnsafe(`EXPLAIN (FORMAT JSON) ${query}`, 'AAPL', new Date());
          
          logger.debug('Query execution plan analyzed', 'DB_OPTIMIZER', 'QUERY_PLAN', {
            query: query.substring(0, 50) + '...',
            plan: JSON.stringify(plan).substring(0, 200)
          });

        } catch (error) {
          logger.warn('Query plan analysis failed', 'DB_OPTIMIZER', 'PLAN_WARNING', {
            query: query.substring(0, 50),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

    } catch (error) {
      logger.error('Query plan analysis failed', 'DB_OPTIMIZER', 'ANALYSIS_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Run database maintenance tasks
  private async runMaintenance(): Promise<void> {
    try {
      logger.info('Running database maintenance', 'DB_OPTIMIZER', 'MAINTENANCE_START');

      // Vacuum tables to reclaim space and update statistics
      const tables = ['Position', 'Trade', 'Order', 'AlertLog'];
      
      for (const table of tables) {
        try {
          await prisma.$executeRawUnsafe(`VACUUM ANALYZE "${table}"`);
          logger.debug(`Vacuumed table ${table}`, 'DB_OPTIMIZER', 'VACUUM');
        } catch (error) {
          logger.warn(`Vacuum failed for table ${table}`, 'DB_OPTIMIZER', 'VACUUM_WARNING', {
            table,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Clean up old alert logs (keep last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedAlerts = await prisma.alertLog.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo
          }
        }
      });

      logger.info('Database maintenance completed', 'DB_OPTIMIZER', 'MAINTENANCE_COMPLETE', {
        deletedAlerts: deletedAlerts.count
      });

      this.lastMaintenanceRun = new Date();

    } catch (error) {
      logger.error('Database maintenance failed', 'DB_OPTIMIZER', 'MAINTENANCE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Setup query performance logging
  private setupQueryLogging(): void {
    // This would typically be done at the Prisma Client level
    // For now, we'll simulate query logging
    logger.debug('Query performance logging initialized', 'DB_OPTIMIZER', 'LOGGING_INIT');
  }

  // Log slow queries
  logQuery(query: string, executionTime: number, rowsAffected: number = 0): void {
    const queryPerformance: QueryPerformance = {
      query: query.length > 100 ? query.substring(0, 100) + '...' : query,
      executionTime,
      rowsAffected,
      timestamp: new Date()
    };

    this.queryStats.push(queryPerformance);

    // Keep only last 1000 query stats
    if (this.queryStats.length > 1000) {
      this.queryStats = this.queryStats.slice(-1000);
    }

    // Log slow queries
    if (executionTime > this.slowQueryThreshold) {
      logger.warn('Slow query detected', 'DB_OPTIMIZER', 'SLOW_QUERY', queryPerformance);
    }
  }

  // Get database performance statistics
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      // Get basic PostgreSQL statistics
      const connectionCount = await this.getConnectionCount();
      const slowQueries = this.queryStats.filter(q => q.executionTime > this.slowQueryThreshold).length;
      
      return {
        connectionCount,
        activeQueries: 0, // Would need proper monitoring
        slowQueries,
        indexHitRatio: 0, // Would need proper calculation
        cacheHitRatio: 0, // Would need proper calculation
        diskUsage: 'N/A', // Would need proper disk monitoring
        lastOptimized: this.lastMaintenanceRun || new Date()
      };

    } catch (error) {
      logger.error('Failed to get database stats', 'DB_OPTIMIZER', 'STATS_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        connectionCount: 0,
        activeQueries: 0,
        slowQueries: 0,
        indexHitRatio: 0,
        cacheHitRatio: 0,
        diskUsage: 'N/A',
        lastOptimized: new Date()
      };
    }
  }

  // Get connection count
  private async getConnectionCount(): Promise<number> {
    try {
      const result = await prisma.$queryRaw`
        SELECT count(*) as connection_count 
        FROM pg_stat_activity 
        WHERE state = 'active'
      ` as any[];
      
      return parseInt(result[0]?.connection_count || '0');
    } catch (error) {
      logger.error('Failed to get connection count', 'DB_OPTIMIZER', 'CONNECTION_COUNT_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  // Get slow queries report
  getSlowQueriesReport(limit: number = 20): QueryPerformance[] {
    return this.queryStats
      .filter(q => q.executionTime > this.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  // Get query statistics
  getQueryStatistics(): {
    totalQueries: number;
    slowQueries: number;
    averageExecutionTime: number;
    slowestQuery: QueryPerformance | null;
  } {
    if (this.queryStats.length === 0) {
      return {
        totalQueries: 0,
        slowQueries: 0,
        averageExecutionTime: 0,
        slowestQuery: null
      };
    }

    const totalQueries = this.queryStats.length;
    const slowQueries = this.queryStats.filter(q => q.executionTime > this.slowQueryThreshold).length;
    const averageExecutionTime = this.queryStats.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries;
    const slowestQuery = this.queryStats.reduce((slowest, current) => 
      current.executionTime > slowest.executionTime ? current : slowest
    );

    return {
      totalQueries,
      slowQueries,
      averageExecutionTime: Math.round(averageExecutionTime),
      slowestQuery
    };
  }

  // Schedule regular optimization
  scheduleOptimization(intervalHours: number = 24): void {
    setInterval(() => {
      this.applyOptimizations().catch(error => {
        logger.error('Scheduled optimization failed', 'DB_OPTIMIZER', 'SCHEDULED_ERROR', { error });
      });
    }, intervalHours * 60 * 60 * 1000);

    logger.info('Database optimization scheduled', 'DB_OPTIMIZER', 'SCHEDULE', {
      intervalHours
    });
  }

  // EventEmitter functionality (simplified)
  private emit(event: string, ...args: any[]): void {
    logger.debug(`Database optimizer event: ${event}`, 'DB_OPTIMIZER', 'EVENT', { args });
  }
}

export default DatabaseOptimizer.getInstance();