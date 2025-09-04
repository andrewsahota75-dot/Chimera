interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  defaultTTL: number;
  keyPrefix: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalOperations: number;
  hitRate: number;
}

export class CacheService {
  private static instance: CacheService;
  private client: any = null;
  private connected: boolean = false;
  private stats: CacheStats = { hits: 0, misses: 0, totalOperations: 0, hitRate: 0 };
  private config: CacheConfig;
  private fallbackStorage: Map<string, { value: any; expires: number }> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      defaultTTL: 300, // 5 minutes
      keyPrefix: 'chimera:',
      ...config
    };

    this.initializeClient();
  }

  static getInstance(config?: Partial<CacheConfig>): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  private async initializeClient(): Promise<void> {
    try {
      // For now, use in-memory fallback since Redis might not be available in all environments
      console.log('🔄 Cache Service: Using in-memory fallback (Redis not configured)');
      this.connected = true;
      this.startCleanupInterval();
    } catch (error) {
      console.error('❌ Failed to connect to Redis, using in-memory fallback:', error);
      this.connected = true; // Still "connected" to fallback
    }
  }

  // Core cache operations
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const fullKey = this.config.keyPrefix + key;
      const ttl = ttlSeconds || this.config.defaultTTL;
      const expires = Date.now() + (ttl * 1000);

      if (this.client) {
        await this.client.setex(fullKey, ttl, JSON.stringify(value));
      } else {
        // Fallback to memory
        this.fallbackStorage.set(fullKey, { value, expires });
      }

      return true;
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const fullKey = this.config.keyPrefix + key;
      this.stats.totalOperations++;

      let result = null;

      if (this.client) {
        const data = await this.client.get(fullKey);
        result = data ? JSON.parse(data) : null;
      } else {
        // Fallback to memory
        const entry = this.fallbackStorage.get(fullKey);
        if (entry && entry.expires > Date.now()) {
          result = entry.value;
        } else if (entry) {
          this.fallbackStorage.delete(fullKey);
        }
      }

      if (result !== null) {
        this.stats.hits++;
      } else {
        this.stats.misses++;
      }

      this.updateHitRate();
      return result;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const fullKey = this.config.keyPrefix + key;

      if (this.client) {
        await this.client.del(fullKey);
      } else {
        this.fallbackStorage.delete(fullKey);
      }

      return true;
    } catch (error) {
      console.error(`Cache DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.config.keyPrefix + key;

      if (this.client) {
        const result = await this.client.exists(fullKey);
        return result === 1;
      } else {
        const entry = this.fallbackStorage.get(fullKey);
        return entry !== undefined && entry.expires > Date.now();
      }
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Trading-specific cache methods
  async cacheMarketData(symbol: string, data: any, ttlSeconds: number = 30): Promise<void> {
    await this.set(`market:${symbol}`, data, ttlSeconds);
  }

  async getMarketData(symbol: string): Promise<any> {
    return await this.get(`market:${symbol}`);
  }

  async cachePortfolioData(userId: string, data: any, ttlSeconds: number = 60): Promise<void> {
    await this.set(`portfolio:${userId}`, data, ttlSeconds);
  }

  async getPortfolioData(userId: string): Promise<any> {
    return await this.get(`portfolio:${userId}`);
  }

  async cacheOrderBook(symbol: string, orderBook: any, ttlSeconds: number = 5): Promise<void> {
    await this.set(`orderbook:${symbol}`, orderBook, ttlSeconds);
  }

  async getOrderBook(symbol: string): Promise<any> {
    return await this.get(`orderbook:${symbol}`);
  }

  // Strategy signal caching
  async cacheStrategySignals(strategyId: string, signals: any[], ttlSeconds: number = 120): Promise<void> {
    await this.set(`signals:${strategyId}`, signals, ttlSeconds);
  }

  async getStrategySignals(strategyId: string): Promise<any[]> {
    return (await this.get(`signals:${strategyId}`)) || [];
  }

  // Session and user data caching
  async cacheUserSession(sessionId: string, userData: any, ttlSeconds: number = 3600): Promise<void> {
    await this.set(`session:${sessionId}`, userData, ttlSeconds);
  }

  async getUserSession(sessionId: string): Promise<any> {
    return await this.get(`session:${sessionId}`);
  }

  // Rate limiting support
  async incrementCounter(key: string, windowSeconds: number): Promise<number> {
    try {
      const fullKey = this.config.keyPrefix + key;
      
      if (this.client) {
        const multi = this.client.multi();
        multi.incr(fullKey);
        multi.expire(fullKey, windowSeconds);
        const results = await multi.exec();
        return results[0][1];
      } else {
        // Fallback implementation
        const entry = this.fallbackStorage.get(fullKey);
        const now = Date.now();
        
        if (!entry || entry.expires < now) {
          const newValue = { value: 1, expires: now + (windowSeconds * 1000) };
          this.fallbackStorage.set(fullKey, newValue);
          return 1;
        } else {
          entry.value++;
          return entry.value;
        }
      }
    } catch (error) {
      console.error(`Cache counter error for key ${key}:`, error);
      return 0;
    }
  }

  // Batch operations
  async mget(keys: string[]): Promise<(any | null)[]> {
    const results = await Promise.all(keys.map(key => this.get(key)));
    return results;
  }

  async mset(keyValuePairs: { [key: string]: any }, ttlSeconds?: number): Promise<boolean> {
    try {
      const promises = Object.entries(keyValuePairs).map(([key, value]) => 
        this.set(key, value, ttlSeconds)
      );
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Cache MSET error:', error);
      return false;
    }
  }

  // Pattern-based operations
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      let deleted = 0;
      const fullPattern = this.config.keyPrefix + pattern;

      if (this.client) {
        const keys = await this.client.keys(fullPattern);
        if (keys.length > 0) {
          deleted = await this.client.del(...keys);
        }
      } else {
        // Fallback pattern matching
        const regex = new RegExp(fullPattern.replace('*', '.*'));
        for (const [key] of this.fallbackStorage) {
          if (regex.test(key)) {
            this.fallbackStorage.delete(key);
            deleted++;
          }
        }
      }

      return deleted;
    } catch (error) {
      console.error(`Cache pattern delete error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Cache management
  async clear(): Promise<void> {
    try {
      if (this.client) {
        const keys = await this.client.keys(this.config.keyPrefix + '*');
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } else {
        this.fallbackStorage.clear();
      }
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Statistics and monitoring
  getStats(): CacheStats & { connected: boolean; storageSize: number } {
    return {
      ...this.stats,
      connected: this.connected,
      storageSize: this.fallbackStorage.size
    };
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalOperations > 0 
      ? (this.stats.hits / this.stats.totalOperations) * 100 
      : 0;
  }

  private startCleanupInterval(): void {
    // Clean up expired entries in fallback storage every 5 minutes
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, entry] of this.fallbackStorage) {
        if (entry.expires < now) {
          this.fallbackStorage.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      const testKey = 'health_check_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };
      
      const setSuccess = await this.set(testKey, testValue, 10);
      const getValue = await this.get(testKey);
      const delSuccess = await this.del(testKey);
      
      const isHealthy = setSuccess && getValue !== null && delSuccess;
      
      return {
        status: isHealthy ? 'healthy' : 'degraded',
        details: {
          connected: this.connected,
          operations: { set: setSuccess, get: getValue !== null, del: delSuccess },
          stats: this.getStats()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message, connected: this.connected }
      };
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
      }
      this.connected = false;
      console.log('📴 Cache service disconnected');
    } catch (error) {
      console.error('Error disconnecting cache:', error);
    }
  }
}