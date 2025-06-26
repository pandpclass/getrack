import Fastify from 'fastify';
import cors from '@fastify/cors';
import { apiRoutes } from './routes/api.js';
import { PriceSyncJob } from './jobs/price-sync.js';
import prisma from '../lib/database.js';

/**
 * Main Server Application
 * 
 * This is the entry point for the OSRS Grand Exchange Tracker backend server.
 * It sets up the Fastify web server, configures middleware, registers routes,
 * initializes the database, and starts background jobs for data synchronization.
 * 
 * The server handles:
 * - RESTful API endpoints for trading data
 * - CORS configuration for frontend integration
 * - Database connection management
 * - Scheduled background jobs
 * - Graceful shutdown procedures
 */

/**
 * Create Fastify server instance with logging configuration
 * 
 * The server is configured with structured logging using pino-pretty
 * for better development experience and production monitoring.
 */
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty', // Pretty-print logs in development
    },
  },
});

/**
 * CORS Configuration
 * 
 * Enables Cross-Origin Resource Sharing to allow the frontend application
 * to communicate with the API. In development, all origins are allowed.
 * In production, this should be configured to only allow specific domains.
 */
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true,
});

/**
 * API Routes Registration
 * 
 * Registers all API endpoints defined in the routes module.
 * This includes portfolio suggestions, opportunities, sync, and health endpoints.
 */
await fastify.register(apiRoutes);

/**
 * Root Health Check Endpoint
 * 
 * Provides a simple health check at the root URL for monitoring
 * and confirming the server is running properly.
 */
fastify.get('/', async (request, reply) => {
  return { 
    message: 'OSRS Grand Exchange Tracker API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date(),
  };
});

/**
 * Graceful Shutdown Handler - SIGINT
 * 
 * Handles Ctrl+C interruption by properly closing database connections
 * and the web server before exiting. This prevents data corruption and
 * ensures clean shutdown in development.
 */
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
});

/**
 * Graceful Shutdown Handler - SIGTERM
 * 
 * Handles termination signals from process managers (like PM2, Docker)
 * by properly closing all connections before shutdown. This is crucial
 * for production deployments.
 */
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
});

/**
 * Server Startup Function
 * 
 * Handles the complete server initialization process including:
 * - Database connection establishment
 * - Initial data synchronization (if needed)
 * - Background job scheduling
 * - HTTP server startup
 * 
 * Includes comprehensive error handling for startup failures.
 */
async function start() {
  try {
    // Determine server configuration based on environment
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

    // Establish database connection
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connected successfully');

    // Check if initial data sync is needed
    const itemCount = await prisma.item.count();
    if (itemCount === 0) {
      console.log('No items found, running initial sync...');
      await PriceSyncJob.runInitialSync();
    }

    // Start background job scheduler
    PriceSyncJob.start();

    // Start the HTTP server
    await fastify.listen({ port, host });
    console.log(`🚀 Server ready at http://${host}:${port}`);
  } catch (err) {
    // Handle startup failures
    console.error('Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Initialize the server
start();