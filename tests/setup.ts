// Global test setup
import { PrismaClient } from '@prisma/client';

declare global {
  var __PRISMA__: PrismaClient;
}

// Setup test database
beforeAll(async () => {
  // Initialize test database connection
  global.__PRISMA__ = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  });

  // Clean up test data
  await global.__PRISMA__.$connect();
  
  console.log('Test database connected');
});

afterAll(async () => {
  // Cleanup
  if (global.__PRISMA__) {
    await global.__PRISMA__.$disconnect();
  }
  
  console.log('Test database disconnected');
});

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};