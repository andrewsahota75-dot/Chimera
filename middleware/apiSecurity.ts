import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.js';

// IP-based tracking for suspicious activity
const suspiciousActivity = new Map<string, {
  attempts: number;
  lastAttempt: Date;
  blocked: boolean;
}>();

// Rate limiting configurations
export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        message: options.message || 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response) => {
      const clientIp = getClientIp(req);
      logger.warn('Rate limit exceeded', 'SECURITY', 'RATE_LIMIT', {
        ip: clientIp,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: options.message || 'Too many requests from this IP, please try again later',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });
    }
  });
};

// Specific rate limits for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later'
});

export const tradingRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 trading requests per minute
  message: 'Too many trading requests, please slow down'
});

export const generalApiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 general API requests per 15 minutes
  message: 'Too many API requests, please try again later'
});

export const dataRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 data requests per minute
  message: 'Too many data requests, please reduce frequency'
});

// Advanced security middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for WebSocket compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// IP whitelist/blacklist middleware
export const ipFilter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = getClientIp(req);
  const whitelist = process.env.IP_WHITELIST?.split(',').map(ip => ip.trim()) || [];
  const blacklist = process.env.IP_BLACKLIST?.split(',').map(ip => ip.trim()) || [];

  // Check blacklist
  if (blacklist.length > 0 && blacklist.includes(clientIp)) {
    logger.warn('Blocked request from blacklisted IP', 'SECURITY', 'IP_BLACKLIST', {
      ip: clientIp,
      path: req.path
    });
    
    res.status(403).json({
      success: false,
      error: { message: 'Access denied' }
    });
    return;
  }

  // Check whitelist (if configured)
  if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
    logger.warn('Blocked request from non-whitelisted IP', 'SECURITY', 'IP_WHITELIST', {
      ip: clientIp,
      path: req.path
    });
    
    res.status(403).json({
      success: false,
      error: { message: 'Access denied' }
    });
    return;
  }

  next();
};

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Remove potentially dangerous characters from query parameters
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    });

    // Sanitize request body if it exists
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

    // Check for suspicious patterns
    const suspicious = detectSuspiciousPatterns(req);
    if (suspicious.length > 0) {
      const clientIp = getClientIp(req);
      logger.warn('Suspicious request patterns detected', 'SECURITY', 'SUSPICIOUS_PATTERN', {
        ip: clientIp,
        patterns: suspicious,
        path: req.path,
        method: req.method
      });
      
      trackSuspiciousActivity(clientIp);
    }

    next();
  } catch (error) {
    logger.error('Request sanitization error', 'SECURITY', 'SANITIZATION', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path
    });
    next();
  }
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const clientIp = getClientIp(req);
  
  // Log the request
  logger.debug(`${req.method} ${req.path}`, 'API', 'REQUEST', {
    ip: clientIp,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Log the response when it's finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'WARN' : 'INFO';
    
    logger[logLevel.toLowerCase() as 'info' | 'warn'](
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, 
      'API', 
      'RESPONSE',
      {
        ip: clientIp,
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString()
      }
    );
  });

  next();
};

// Security validation for trading endpoints
export const tradingSecurityCheck = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = getClientIp(req);
  
  // Check if IP is currently blocked for suspicious activity
  const activity = suspiciousActivity.get(clientIp);
  if (activity && activity.blocked) {
    const blockExpiry = new Date(activity.lastAttempt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    if (new Date() < blockExpiry) {
      logger.warn('Blocked trading request from suspicious IP', 'SECURITY', 'TRADING_BLOCK', {
        ip: clientIp,
        attempts: activity.attempts,
        blockedUntil: blockExpiry
      });
      
      res.status(403).json({
        success: false,
        error: { 
          message: 'Trading access temporarily blocked due to suspicious activity',
          code: 'TRADING_BLOCKED'
        }
      });
      return;
    } else {
      // Block expired, reset
      suspiciousActivity.delete(clientIp);
    }
  }

  // Additional trading-specific validations
  if (req.body) {
    const { symbol, quantity, price } = req.body;
    
    // Basic validation
    if (symbol && !/^[A-Z0-9]+$/.test(symbol)) {
      logger.warn('Invalid symbol format in trading request', 'SECURITY', 'TRADING_VALIDATION', {
        ip: clientIp,
        symbol,
        path: req.path
      });
      
      res.status(400).json({
        success: false,
        error: { message: 'Invalid symbol format' }
      });
      return;
    }

    // Check for unrealistic values
    if (quantity && (quantity <= 0 || quantity > 1000000)) {
      logger.warn('Suspicious quantity in trading request', 'SECURITY', 'TRADING_VALIDATION', {
        ip: clientIp,
        quantity,
        path: req.path
      });
      
      trackSuspiciousActivity(clientIp);
    }

    if (price && (price <= 0 || price > 1000000)) {
      logger.warn('Suspicious price in trading request', 'SECURITY', 'TRADING_VALIDATION', {
        ip: clientIp,
        price,
        path: req.path
      });
      
      trackSuspiciousActivity(clientIp);
    }
  }

  next();
};

// Helper functions
function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         'unknown';
}

function sanitizeString(str: string): string {
  // Remove potential XSS and injection patterns
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/['"<>]/g, '')
    .trim();
}

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

function detectSuspiciousPatterns(req: Request): string[] {
  const suspicious: string[] = [];
  const fullUrl = `${req.method} ${req.path}${req.url}`;
  const body = JSON.stringify(req.body || {});
  
  // SQL injection patterns
  if (/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b)/i.test(fullUrl + body)) {
    suspicious.push('SQL_INJECTION');
  }
  
  // XSS patterns
  if (/<script|javascript:|on\w+=/i.test(fullUrl + body)) {
    suspicious.push('XSS_ATTEMPT');
  }
  
  // Command injection patterns
  if (/(\||\;|\&\&|\|\||\$\(|\`)/g.test(fullUrl + body)) {
    suspicious.push('COMMAND_INJECTION');
  }
  
  // Path traversal patterns
  if (/\.\.(\/|\\)/g.test(fullUrl)) {
    suspicious.push('PATH_TRAVERSAL');
  }

  return suspicious;
}

function trackSuspiciousActivity(ip: string): void {
  const activity = suspiciousActivity.get(ip) || { attempts: 0, lastAttempt: new Date(), blocked: false };
  
  activity.attempts += 1;
  activity.lastAttempt = new Date();
  
  // Block IP after 10 suspicious attempts
  if (activity.attempts >= 10) {
    activity.blocked = true;
    logger.critical('IP blocked due to suspicious activity', 'SECURITY', 'IP_BLOCKED', {
      ip,
      attempts: activity.attempts,
      blockTime: activity.lastAttempt
    });
  }
  
  suspiciousActivity.set(ip, activity);
}

// Export middleware collections
export const basicSecurity = [securityHeaders, ipFilter, sanitizeRequest, requestLogger];
export const tradingSecurity = [...basicSecurity, tradingSecurityCheck, tradingRateLimit];
export const authSecurity = [...basicSecurity, authRateLimit];
export const dataSecurity = [...basicSecurity, dataRateLimit];

export default {
  securityHeaders,
  ipFilter,
  sanitizeRequest,
  requestLogger,
  tradingSecurityCheck,
  authRateLimit,
  tradingRateLimit,
  generalApiRateLimit,
  dataRateLimit,
  basicSecurity,
  tradingSecurity,
  authSecurity,
  dataSecurity
};