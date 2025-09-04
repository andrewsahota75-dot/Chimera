import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import logger from '../services/logger.js';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export const validateRequest = (
  schema: ZodSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[property];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((error: any) => ({
          field: error.path.join('.'),
          message: error.message,
          code: error.code
        }));

        logger.warn('Request validation failed', 'API', 'VALIDATION', {
          endpoint: req.path,
          method: req.method,
          property,
          errors,
          data
        });

        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors
          }
        });
        return;
      }

      // Replace the request property with validated and transformed data
      req[property] = result.data;
      
      logger.debug('Request validation successful', 'API', 'VALIDATION', {
        endpoint: req.path,
        method: req.method,
        property
      });

      next();
    } catch (error) {
      logger.error('Validation middleware error', 'API', 'VALIDATION', {
        endpoint: req.path,
        method: req.method,
        property,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: { message: 'Internal validation error' }
      });
    }
  };
};

// Convenience validation functions for common schemas
export const validateBody = (schema: ZodSchema) => validateRequest(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validateRequest(schema, 'query');
export const validateParams = (schema: ZodSchema) => validateRequest(schema, 'params');

// Middleware factory for multiple validation rules
export const validateMultiple = (validations: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: ValidationError[] = [];

      // Validate body
      if (validations.body) {
        const bodyResult = validations.body.safeParse(req.body);
        if (!bodyResult.success) {
          errors.push(...bodyResult.error.issues.map((error: any) => ({
            field: `body.${error.path.join('.')}`,
            message: error.message,
            code: error.code
          })));
        } else {
          req.body = bodyResult.data;
        }
      }

      // Validate query
      if (validations.query) {
        const queryResult = validations.query.safeParse(req.query);
        if (!queryResult.success) {
          errors.push(...queryResult.error.issues.map((error: any) => ({
            field: `query.${error.path.join('.')}`,
            message: error.message,
            code: error.code
          })));
        } else {
          req.query = queryResult.data as any;
        }
      }

      // Validate params
      if (validations.params) {
        const paramsResult = validations.params.safeParse(req.params);
        if (!paramsResult.success) {
          errors.push(...paramsResult.error.issues.map((error: any) => ({
            field: `params.${error.path.join('.')}`,
            message: error.message,
            code: error.code
          })));
        } else {
          req.params = paramsResult.data as any;
        }
      }

      if (errors.length > 0) {
        logger.warn('Multiple validation failed', 'API', 'VALIDATION', {
          endpoint: req.path,
          method: req.method,
          errors
        });

        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors
          }
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Multiple validation middleware error', 'API', 'VALIDATION', {
        endpoint: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: { message: 'Internal validation error' }
      });
    }
  };
};

export default { validateRequest, validateBody, validateQuery, validateParams, validateMultiple };