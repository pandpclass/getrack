import { PrismaClient } from '@prisma/client';

/**
 * Database Connection Management
 * 
 * This module handles the Prisma database client setup with proper singleton
 * pattern implementation to prevent multiple database connections in development.
 * 
 * The singleton pattern is especially important in development with hot reloading,
 * as it prevents the creation of multiple database connections that could lead
 * to connection pool exhaustion.
 */

/**
 * Global declaration for development singleton
 * This allows us to store the Prisma client on the global object
 * to persist it across hot reloads in development
 */
declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Prisma Client Instance
 * 
 * In production: Creates a new PrismaClient instance
 * In development: Reuses existing instance from global object or creates new one
 * 
 * This pattern prevents multiple database connections during development
 * while ensuring clean instances in production environments.
 */
export const prisma = globalThis.__prisma || new PrismaClient();

/**
 * Development Environment Setup
 * 
 * In non-production environments, store the Prisma client on the global object
 * to enable reuse across hot reloads and prevent connection issues.
 */
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

/**
 * Default export for convenience
 * Allows importing as either named or default export
 */
export default prisma;