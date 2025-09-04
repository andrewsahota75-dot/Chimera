import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import logger from './logger.js';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  service: string;
  operation: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ErrorNotification {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  service: string;
  timestamp: Date;
  context?: ErrorContext;
  resolved: boolean;
  resolvedAt?: Date;
  actions?: string[];
}

export class GlobalErrorHandler extends EventEmitter {
  private static instance: GlobalErrorHandler;
  private errorNotifications: ErrorNotification[] = [];
  private errorCounts: Map<string, number> = new Map();
  private recoveryStrategies: Map<string, Function> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();

  constructor() {
    super();
    this.setupDefaultRecoveryStrategies();
    this.startErrorCleanup();
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  // Express error middleware
  middleware() {
    return (error: Error, req: Request, res: Response, next: NextFunction): void => {
      const context: ErrorContext = {
        userId: (req as any).user?.userId,
        sessionId: req.headers['x-session-id'] as string,
        requestId: req.headers['x-request-id'] as string || this.generateId(),
        service: 'API',
        operation: `${req.method} ${req.path}`,
        timestamp: new Date(),
        metadata: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          body: req.body,
          query: req.query
        }
      };

      this.handleError(error, context);

      // Send error response
      if (!res.headersSent) {
        const statusCode = this.getStatusCode(error);
        const errorResponse = this.getErrorResponse(error, context);
        
        res.status(statusCode).json(errorResponse);
      }
    };
  }

  // Main error handling function
  handleError(error: Error, context: ErrorContext): void {
    try {
      const errorKey = `${context.service}:${error.name}`;
      
      // Update error counts
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

      // Log the error
      logger.error(error.message, context.service, error, {
        context,
        stack: error.stack,
        count: this.errorCounts.get(errorKey)
      });

      // Check circuit breaker
      this.updateCircuitBreaker(errorKey);

      // Create notification
      const notification = this.createErrorNotification(error, context);
      this.addNotification(notification);

      // Attempt recovery
      this.attemptRecovery(error, context);

      // Emit error event for external listeners
      this.emit('error', { error, context, notification });

    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
      logger.critical('Error handler failure', 'ERROR_HANDLER', handlingError as Error);
    }
  }

  // Handle async errors
  handleAsyncError(error: Error, context: ErrorContext): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.handleError(error, context);
        resolve();
      } catch (handlingError) {
        logger.critical('Async error handler failure', 'ERROR_HANDLER', handlingError as Error);
        resolve();
      }
    });
  }

  // Create error notification
  private createErrorNotification(error: Error, context: ErrorContext): ErrorNotification {
    const severity = this.getErrorSeverity(error);
    const id = this.generateId();

    return {
      id,
      type: severity,
      title: this.getErrorTitle(error, context),
      message: this.getErrorMessage(error, context),
      service: context.service,
      timestamp: context.timestamp,
      context,
      resolved: false,
      actions: this.getRecommendedActions(error, context)
    };
  }

  // Add notification and manage queue
  private addNotification(notification: ErrorNotification): void {
    this.errorNotifications.unshift(notification);
    
    // Keep only last 1000 notifications
    if (this.errorNotifications.length > 1000) {
      this.errorNotifications = this.errorNotifications.slice(0, 1000);
    }

    // Emit notification event
    this.emit('notification', notification);

    // Auto-resolve low severity notifications after 1 hour
    if (notification.type === 'INFO') {
      setTimeout(() => {
        this.resolveNotification(notification.id);
      }, 60 * 60 * 1000);
    }
  }

  // Attempt automatic recovery
  private attemptRecovery(error: Error, context: ErrorContext): void {
    const recoveryKey = error.name || 'generic';
    const recoveryStrategy = this.recoveryStrategies.get(recoveryKey);

    if (recoveryStrategy) {
      try {
        logger.info(`Attempting recovery for ${error.name}`, 'ERROR_HANDLER', 'RECOVERY', { context });
        recoveryStrategy(error, context);
      } catch (recoveryError) {
        logger.error('Recovery strategy failed', 'ERROR_HANDLER', recoveryError as Error, { 
          originalError: error.name,
          context 
        });
      }
    }
  }

  // Circuit breaker pattern
  private updateCircuitBreaker(errorKey: string): void {
    const breaker = this.circuitBreakers.get(errorKey) || { failures: 0, lastFailure: new Date(), isOpen: false };
    
    breaker.failures++;
    breaker.lastFailure = new Date();

    // Open circuit if too many failures in short time
    if (breaker.failures >= 10 && !breaker.isOpen) {
      breaker.isOpen = true;
      logger.critical(`Circuit breaker opened for ${errorKey}`, 'ERROR_HANDLER', 'CIRCUIT_BREAKER', {
        failures: breaker.failures,
        errorKey
      });

      // Auto-reset after 5 minutes
      setTimeout(() => {
        breaker.isOpen = false;
        breaker.failures = 0;
        logger.info(`Circuit breaker reset for ${errorKey}`, 'ERROR_HANDLER', 'CIRCUIT_BREAKER');
      }, 5 * 60 * 1000);
    }

    this.circuitBreakers.set(errorKey, breaker);
  }

  // Check if circuit breaker is open
  isCircuitOpen(service: string, operation: string): boolean {
    const key = `${service}:${operation}`;
    return this.circuitBreakers.get(key)?.isOpen || false;
  }

  // Setup default recovery strategies
  private setupDefaultRecoveryStrategies(): void {
    // Database connection recovery
    this.recoveryStrategies.set('DatabaseError', (error: Error, context: ErrorContext) => {
      logger.info('Attempting database reconnection', 'ERROR_HANDLER', 'RECOVERY');
      // Would implement database reconnection logic
    });

    // API timeout recovery
    this.recoveryStrategies.set('TimeoutError', (error: Error, context: ErrorContext) => {
      logger.info('Implementing timeout recovery', 'ERROR_HANDLER', 'RECOVERY');
      // Would implement retry with exponential backoff
    });

    // Memory leak recovery
    this.recoveryStrategies.set('OutOfMemoryError', (error: Error, context: ErrorContext) => {
      logger.critical('Memory issue detected - triggering cleanup', 'ERROR_HANDLER', 'RECOVERY');
      // Would implement memory cleanup
      if (global.gc) {
        global.gc();
      }
    });

    // Network recovery
    this.recoveryStrategies.set('NetworkError', (error: Error, context: ErrorContext) => {
      logger.info('Network error recovery initiated', 'ERROR_HANDLER', 'RECOVERY');
      // Would implement network retry logic
    });
  }

  // Register custom recovery strategy
  registerRecoveryStrategy(errorType: string, strategy: Function): void {
    this.recoveryStrategies.set(errorType, strategy);
    logger.info(`Recovery strategy registered for ${errorType}`, 'ERROR_HANDLER', 'REGISTER');
  }

  // Get error severity
  private getErrorSeverity(error: Error): 'CRITICAL' | 'WARNING' | 'INFO' {
    // Critical errors
    if (error.name.includes('OutOfMemory') || 
        error.name.includes('Database') ||
        error.name.includes('Auth') ||
        error.message.includes('ECONNREFUSED')) {
      return 'CRITICAL';
    }

    // Warning errors
    if (error.name.includes('Validation') ||
        error.name.includes('Timeout') ||
        error.name.includes('Rate')) {
      return 'WARNING';
    }

    return 'INFO';
  }

  // Get user-friendly error title
  private getErrorTitle(error: Error, context: ErrorContext): string {
    const titleMap: Record<string, string> = {
      'ValidationError': 'Input Validation Failed',
      'DatabaseError': 'Database Connection Issue',
      'TimeoutError': 'Request Timeout',
      'AuthenticationError': 'Authentication Failed',
      'AuthorizationError': 'Access Denied',
      'NetworkError': 'Network Connection Problem',
      'RateLimitError': 'Too Many Requests'
    };

    return titleMap[error.name] || `System Error in ${context.service}`;
  }

  // Get user-friendly error message
  private getErrorMessage(error: Error, context: ErrorContext): string {
    const messageMap: Record<string, string> = {
      'ValidationError': 'The information you provided is invalid. Please check and try again.',
      'DatabaseError': 'We\'re experiencing database connectivity issues. Please try again in a few minutes.',
      'TimeoutError': 'The request took too long to process. Please try again.',
      'AuthenticationError': 'Your session has expired. Please log in again.',
      'AuthorizationError': 'You don\'t have permission to perform this action.',
      'NetworkError': 'Network connection problem. Please check your internet connection.',
      'RateLimitError': 'You\'re making requests too quickly. Please wait a moment and try again.'
    };

    return messageMap[error.name] || 'An unexpected error occurred. Our team has been notified.';
  }

  // Get recommended actions
  private getRecommendedActions(error: Error, context: ErrorContext): string[] {
    const actionMap: Record<string, string[]> = {
      'ValidationError': ['Check input format', 'Review required fields'],
      'DatabaseError': ['Try again in a few minutes', 'Contact support if problem persists'],
      'TimeoutError': ['Try again', 'Check network connection'],
      'AuthenticationError': ['Log in again', 'Clear browser cache'],
      'AuthorizationError': ['Contact administrator', 'Check your permissions'],
      'NetworkError': ['Check internet connection', 'Try again'],
      'RateLimitError': ['Wait a moment', 'Reduce request frequency']
    };

    return actionMap[error.name] || ['Try again', 'Contact support if problem continues'];
  }

  // Get HTTP status code
  private getStatusCode(error: Error): number {
    const statusMap: Record<string, number> = {
      'ValidationError': 400,
      'AuthenticationError': 401,
      'AuthorizationError': 403,
      'NotFoundError': 404,
      'TimeoutError': 408,
      'RateLimitError': 429,
      'DatabaseError': 503,
      'NetworkError': 503
    };

    return statusMap[error.name] || 500;
  }

  // Get API error response
  private getErrorResponse(error: Error, context: ErrorContext): any {
    return {
      success: false,
      error: {
        message: this.getErrorMessage(error, context),
        code: error.name,
        requestId: context.requestId,
        timestamp: context.timestamp.toISOString()
      }
    };
  }

  // Notification management
  getNotifications(options: {
    limit?: number;
    type?: 'CRITICAL' | 'WARNING' | 'INFO';
    service?: string;
    unresolved?: boolean;
  } = {}): ErrorNotification[] {
    let notifications = [...this.errorNotifications];

    if (options.type) {
      notifications = notifications.filter(n => n.type === options.type);
    }

    if (options.service) {
      notifications = notifications.filter(n => n.service === options.service);
    }

    if (options.unresolved) {
      notifications = notifications.filter(n => !n.resolved);
    }

    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  resolveNotification(id: string): boolean {
    const notification = this.errorNotifications.find(n => n.id === id);
    
    if (notification && !notification.resolved) {
      notification.resolved = true;
      notification.resolvedAt = new Date();
      
      logger.info(`Notification resolved: ${notification.title}`, 'ERROR_HANDLER', 'RESOLVE', { 
        notificationId: id 
      });
      
      this.emit('notificationResolved', notification);
      return true;
    }
    
    return false;
  }

  // Clear old resolved notifications
  private startErrorCleanup(): void {
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const initialCount = this.errorNotifications.length;
      
      this.errorNotifications = this.errorNotifications.filter(notification => {
        if (notification.resolved && notification.resolvedAt && notification.resolvedAt < cutoffTime) {
          return false;
        }
        return true;
      });

      const cleaned = initialCount - this.errorNotifications.length;
      if (cleaned > 0) {
        logger.info(`Cleaned up ${cleaned} old notifications`, 'ERROR_HANDLER', 'CLEANUP');
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByService: Record<string, number>;
    criticalCount: number;
    unresolvedCount: number;
    circuitBreakers: Record<string, boolean>;
  } {
    const errorsByType: Record<string, number> = {};
    const errorsByService: Record<string, number> = {};
    
    this.errorNotifications.forEach(notification => {
      errorsByType[notification.type] = (errorsByType[notification.type] || 0) + 1;
      errorsByService[notification.service] = (errorsByService[notification.service] || 0) + 1;
    });

    const circuitBreakersStatus: Record<string, boolean> = {};
    this.circuitBreakers.forEach((status, key) => {
      circuitBreakersStatus[key] = status.isOpen;
    });

    return {
      totalErrors: this.errorNotifications.length,
      errorsByType,
      errorsByService,
      criticalCount: this.errorNotifications.filter(n => n.type === 'CRITICAL' && !n.resolved).length,
      unresolvedCount: this.errorNotifications.filter(n => !n.resolved).length,
      circuitBreakers: circuitBreakersStatus
    };
  }

  // Process uncaught exceptions
  static setupGlobalHandlers(errorHandler: GlobalErrorHandler): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
      
      errorHandler.handleError(error, {
        service: 'SYSTEM',
        operation: 'uncaughtException',
        timestamp: new Date()
      });
      
      // Give time for logging then exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      
      const error = reason instanceof Error ? reason : new Error(String(reason));
      
      errorHandler.handleError(error, {
        service: 'SYSTEM',
        operation: 'unhandledRejection',
        timestamp: new Date(),
        metadata: { promise: promise.toString() }
      });
    });

    // Handle warnings
    process.on('warning', (warning) => {
      logger.warn(warning.message, 'SYSTEM', 'WARNING', {
        name: warning.name,
        stack: warning.stack
      });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\nReceived ${signal}. Graceful shutdown...`);
      
      errorHandler.emit('shutdown', { signal });
      
      // Close servers, databases, etc.
      setTimeout(() => {
        console.log('Graceful shutdown completed');
        process.exit(0);
      }, 5000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Utility functions for common error scenarios
export class ErrorUtils {
  static createValidationError(field: string, message: string): Error {
    const error = new Error(`Validation failed for ${field}: ${message}`);
    error.name = 'ValidationError';
    return error;
  }

  static createNotFoundError(resource: string, id?: string): Error {
    const error = new Error(`${resource}${id ? ` with ID ${id}` : ''} not found`);
    error.name = 'NotFoundError';
    return error;
  }

  static createAuthenticationError(message: string = 'Authentication failed'): Error {
    const error = new Error(message);
    error.name = 'AuthenticationError';
    return error;
  }

  static createAuthorizationError(message: string = 'Insufficient permissions'): Error {
    const error = new Error(message);
    error.name = 'AuthorizationError';
    return error;
  }

  static createTimeoutError(operation: string, timeout: number): Error {
    const error = new Error(`${operation} timed out after ${timeout}ms`);
    error.name = 'TimeoutError';
    return error;
  }

  static createRateLimitError(limit: number, window: number): Error {
    const error = new Error(`Rate limit exceeded: ${limit} requests per ${window}ms`);
    error.name = 'RateLimitError';
    return error;
  }
}

// Error-handling decorators for async functions
export function handleAsyncError(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      const result = await method.apply(this, args);
      return result;
    } catch (error) {
      GlobalErrorHandler.getInstance().handleAsyncError(error as Error, {
        service: target.constructor.name,
        operation: propertyName,
        timestamp: new Date()
      });
      throw error;
    }
  };
}

export default GlobalErrorHandler.getInstance();