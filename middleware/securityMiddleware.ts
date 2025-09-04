import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { CacheService } from '../services/cacheService';

// Rate limiting configurations
const createRateLimiter = (windowMs: number, maxRequests: number, message: string) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use cache for distributed rate limiting
    store: {
      incr: async (key: string) => {
        const cache = CacheService.getInstance();
        return cache.incrementCounter(`ratelimit:${key}`, Math.ceil(windowMs / 1000));
      },
      decrement: () => {}, // Not needed for our implementation
      resetAll: () => {}, // Not needed
      resetKey: async (key: string) => {
        const cache = CacheService.getInstance();
        await cache.del(`ratelimit:${key}`);
      }
    } as any
  });
};

// Different rate limits for different endpoints
export const generalRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // requests
  'Too many requests, please try again later'
);

export const tradingRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  10, // requests
  'Trading rate limit exceeded. Please wait before placing more orders'
);

export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // requests
  'Too many authentication attempts, please try again later'
);

export const apiRateLimit = createRateLimiter(
  60 * 1000, // 1 minute
  60, // requests
  'API rate limit exceeded'
);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input validation schemas
export const orderValidationSchema = Joi.object({
  symbol: Joi.string().required().pattern(/^[A-Z0-9]+$/).max(20),
  side: Joi.string().required().valid('BUY', 'SELL'),
  type: Joi.string().required().valid('MARKET', 'LIMIT', 'BRACKET', 'COVER'),
  quantity: Joi.number().required().positive().max(1000000),
  price: Joi.number().positive().max(1000000).when('type', {
    is: 'MARKET',
    then: Joi.optional(),
    otherwise: Joi.required()
  }),
  takeProfitPrice: Joi.number().positive().when('type', {
    is: 'BRACKET',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  stopLossPrice: Joi.number().positive().when('type', {
    is: Joi.valid('BRACKET', 'COVER'),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

export const userValidationSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  password: Joi.string().min(8).max(128).pattern(
    new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')
  ).required(),
  name: Joi.string().optional().max(100).pattern(/^[a-zA-Z\s]+$/)
});

export const portfolioFilterSchema = Joi.object({
  symbols: Joi.array().items(Joi.string().pattern(/^[A-Z0-9]+$/)).max(50),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0)
});

// Validation middleware factory
export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
    }

    req[property] = value;
    next();
  };
};

// IP whitelist/blacklist middleware
const ipWhitelist = new Set(process.env.IP_WHITELIST?.split(',') || []);
const ipBlacklist = new Set(process.env.IP_BLACKLIST?.split(',') || []);

export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
  
  if (ipBlacklist.has(clientIP)) {
    return res.status(403).json({
      error: 'Access denied from this IP address'
    });
  }

  if (ipWhitelist.size > 0 && !ipWhitelist.has(clientIP)) {
    console.warn(`Access attempt from non-whitelisted IP: ${clientIP}`);
    return res.status(403).json({
      error: 'Access denied - IP not whitelisted'
    });
  }

  next();
};

// Request sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potential XSS vectors
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);

  next();
};

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: clientIP,
      userAgent,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length') || 0
    };

    // Log suspicious activity
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('🔒 Security Event:', JSON.stringify(logData));
    }

    // Log successful trading operations
    if (req.originalUrl.includes('/api/orders') && res.statusCode < 400) {
      console.info('💰 Trading Activity:', JSON.stringify({
        ...logData,
        action: req.method === 'POST' ? 'ORDER_PLACED' : 'ORDER_QUERY'
      }));
    }
  });

  next();
};

// CORS configuration for trading
export const tradingCorsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'https://chimera-trading.replit.dev',
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// API key validation (for external integrations)
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required'
    });
  }

  // In production, this would validate against a database
  const validApiKeys = (process.env.VALID_API_KEYS?.split(',') || []);
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key'
    });
  }

  next();
};

// Request size limits
export const requestSizeLimit = {
  json: { limit: '10mb' },
  urlencoded: { limit: '10mb', extended: true }
};

// Security audit middleware
export const securityAudit = (req: Request, res: Response, next: NextFunction) => {
  const securityFlags = {
    hasAuth: !!req.headers.authorization,
    isHTTPS: req.secure || req.headers['x-forwarded-proto'] === 'https',
    hasApiKey: !!req.headers['x-api-key'],
    isTradingEndpoint: req.path.includes('/orders') || req.path.includes('/trades'),
    isHighValue: req.body?.quantity && req.body?.price && 
                 (req.body.quantity * req.body.price) > 50000
  };

  // Log high-risk operations
  if (securityFlags.isTradingEndpoint && !securityFlags.hasAuth) {
    console.error('🚨 SECURITY ALERT: Trading endpoint accessed without authentication');
  }

  if (securityFlags.isHighValue && !securityFlags.isHTTPS) {
    console.warn('⚠️ SECURITY WARNING: High-value operation over HTTP');
  }

  // Add security context to request
  (req as any).securityContext = securityFlags;
  
  next();
};

// Export all middleware as a collection
export const securityMiddleware = {
  generalRateLimit,
  tradingRateLimit,
  authRateLimit,
  apiRateLimit,
  securityHeaders,
  validateRequest,
  ipFilter,
  sanitizeInput,
  securityLogger,
  validateApiKey,
  securityAudit
};