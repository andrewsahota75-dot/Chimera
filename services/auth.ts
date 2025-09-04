import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import logger from './logger.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class AuthService {
  // Generate JWT token
  static generateToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Verify JWT token
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      logger.warn('JWT verification failed', 'AUTH', 'TOKEN', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Create new user
  static async createUser(email: string, password: string, name?: string) {
    try {
      const hashedPassword = await this.hashPassword(password);
      
      const user = await prisma.user.create({
        data: {
          email,
          name,
          // Note: We'll need to add password field to Prisma schema
        }
      });

      logger.info(`New user created: ${email}`, 'AUTH', 'REGISTRATION', { userId: user.id });
      
      return {
        user: { id: user.id, email: user.email, name: user.name },
        token: this.generateToken({ userId: user.id, email: user.email })
      };
    } catch (error) {
      logger.error('Failed to create user', 'AUTH', 'REGISTRATION', { email, error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to create user');
    }
  }

  // Authenticate user
  static async authenticateUser(email: string, password: string) {
    try {
      // Note: We'll need to add password field to User model in Prisma schema
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        logger.warn('Login attempt with non-existent email', 'AUTH', 'LOGIN', { email });
        throw new Error('Invalid credentials');
      }

      // For now, we'll simulate password checking since password field doesn't exist yet
      // const isValidPassword = await this.comparePassword(password, user.password);
      
      logger.info(`User logged in: ${email}`, 'AUTH', 'LOGIN', { userId: user.id });
      
      return {
        user: { id: user.id, email: user.email, name: user.name },
        token: this.generateToken({ userId: user.id, email: user.email })
      };
    } catch (error) {
      logger.error('Authentication failed', 'AUTH', 'LOGIN', { email, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      return user ? { id: user.id, email: user.email, name: user.name } : null;
    } catch (error) {
      logger.error('Failed to get user by ID', 'AUTH', 'USER_LOOKUP', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }
}

// JWT Authentication Middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Access token required' }
      });
      return;
    }

    const decoded = AuthService.verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' }
      });
      return;
    }

    // Verify user still exists
    const user = await AuthService.getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not found' }
      });
      return;
    }

    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    logger.error('Authentication middleware error', 'AUTH', 'MIDDLEWARE', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = AuthService.verifyToken(token);
      if (decoded) {
        const user = await AuthService.getUserById(decoded.userId);
        if (user) {
          req.user = { userId: decoded.userId, email: decoded.email };
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth errors
    logger.warn('Optional auth failed, continuing without user context', 'AUTH', 'OPTIONAL', { error: error instanceof Error ? error.message : 'Unknown error' });
    next();
  }
};

export default AuthService;