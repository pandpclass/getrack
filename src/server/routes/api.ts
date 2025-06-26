import { FastifyInstance } from 'fastify';
import { PriceService } from '../services/price-service.js';
import { ApiResponse, PortfolioSuggestion, FlipOpportunity, ItemHistory } from '../../types/api.js';
import { VOLATILITY_THRESHOLDS } from '../../lib/calculations.js';

/**
 * API Routes Module
 * 
 * Enhanced API endpoints for the OSRS Grand Exchange Tracker with new features:
 * - Volume data integration
 * - Improved filtering and scoring
 * - Item history endpoint for detailed analysis
 * - Enhanced portfolio recommendations
 * 
 * All endpoints follow RESTful conventions and return standardized ApiResponse objects
 * with proper error handling and HTTP status codes.
 */
export async function apiRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/portfolio
   * 
   * Generates optimized portfolio recommendations based on user's budget.
   * Now includes volume filtering, volatility checks, and composite scoring.
   * Limited to 8 items maximum (GE slot limit).
   * 
   * Query Parameters:
   * - budget: Trading budget in GP (required)
   * 
   * Returns: PortfolioSuggestion object with selected opportunities and metrics
   */
  fastify.get<{
    Querystring: { budget: string; minVolume?: string; maxVolatility?: string };
  }>('/api/portfolio', async (request, reply) => {
    try {
      // Parse and validate budget parameter
      const budget = parseFloat(request.query.budget) || 10000000;
      const minVolume = request.query.minVolume ? parseInt(request.query.minVolume) : 0;
      const maxVolatility = request.query.maxVolatility ? parseFloat(request.query.maxVolatility) : VOLATILITY_THRESHOLDS.EXTREME;
      
      // Validate budget range (must be positive and within int32 limits)
      if (budget <= 0 || budget > 2147483647) {
        return reply.status(400).send({
          success: false,
          error: 'Budget must be between 1 and 2,147,483,647 GP',
          timestamp: new Date(),
        } as ApiResponse<null>);
      }

      // Generate enhanced portfolio recommendation
      const portfolio = await PriceService.getPortfolioSuggestion(budget, {
        minVolume,
        maxVolatility,
      });
      
      return reply.send({
        success: true,
        data: portfolio,
        timestamp: new Date(),
      } as ApiResponse<PortfolioSuggestion>);
    } catch (error) {
      console.error('Portfolio API error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate portfolio suggestions',
        timestamp: new Date(),
      } as ApiResponse<null>);
    }
  });

  /**
   * GET /api/opportunities
   * 
   * Returns all available trading opportunities with enhanced filtering.
   * Now includes volume data, volatility filtering, and composite scoring.
   * 
   * Query Parameters:
   * - budget: Budget for opportunity calculation (optional, default: 100M)
   * - limit: Maximum number of opportunities to return (optional, default: 50)
   * 
   * Returns: Array of FlipOpportunity objects
   */
  fastify.get<{
    Querystring: {
      budget?: string;
      limit?: string;
      minVolume?: string;
      maxVolatility?: string;
    };
  }>('/api/opportunities', async (request, reply) => {
    try {
      // Parse query parameters with defaults
      const budget = parseFloat(request.query.budget || '100000000');
      const limit = parseInt(request.query.limit || '50');
      const minVolume = request.query.minVolume ? parseInt(request.query.minVolume) : 0;
      const maxVolatility = request.query.maxVolatility ? parseFloat(request.query.maxVolatility) : VOLATILITY_THRESHOLDS.EXTREME;
      
      // Get all opportunities with enhanced filtering and scoring
      const opportunities = await PriceService.getFlipOpportunities(budget, {
        minVolume,
        maxVolatility,
      });
      const limitedOpportunities = opportunities.slice(0, limit);
      
      return reply.send({
        success: true,
        data: limitedOpportunities,
        timestamp: new Date(),
      } as ApiResponse<FlipOpportunity[]>);
    } catch (error) {
      console.error('Opportunities API error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch flip opportunities',
        timestamp: new Date(),
      } as ApiResponse<null>);
    }
  });

  /**
   * GET /api/history/:itemId
   * 
   * Fetches historical price data for a specific item.
   * Used for detailed analysis and charting in the frontend.
   * 
   * Path Parameters:
   * - itemId: The item ID to fetch history for
   * 
   * Query Parameters:
   * - days: Number of days of history (optional, default: 7)
   * 
   * Returns: ItemHistory object with price data over time
   */
  fastify.get<{
    Params: { itemId: string };
    Querystring: { days?: string };
  }>('/api/history/:itemId', async (request, reply) => {
    try {
      const itemId = parseInt(request.params.itemId);
      const days = parseInt(request.query.days || '7');
      
      if (isNaN(itemId) || itemId <= 0) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid item ID',
          timestamp: new Date(),
        } as ApiResponse<null>);
      }

      const history = await PriceService.getItemHistory(itemId, days);
      
      return reply.send({
        success: true,
        data: history,
        timestamp: new Date(),
      } as ApiResponse<ItemHistory>);
    } catch (error) {
      console.error('History API error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch item history',
        timestamp: new Date(),
      } as ApiResponse<null>);
    }
  });

  /**
   * POST /api/sync
   * 
   * Manually triggers synchronization of item and price data from external APIs.
   * Now also fetches volume data for enhanced analysis.
   * 
   * Returns: Success message confirming sync completion
   */
  fastify.post('/api/sync', async (request, reply) => {
    try {
      // Synchronize both item metadata and current prices
      await PriceService.syncItems();
      await PriceService.syncPrices();
      
      return reply.send({
        success: true,
        data: { message: 'Data sync completed successfully (including volume data)' },
        timestamp: new Date(),
      } as ApiResponse<{ message: string }>);
    } catch (error) {
      console.error('Sync API error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to sync data',
        timestamp: new Date(),
      } as ApiResponse<null>);
    }
  });

  /**
   * GET /api/health
   * 
   * Health check endpoint for monitoring application status.
   * Returns basic system information and confirms API availability.
   * 
   * Returns: Health status object with uptime and timestamp
   */
  fastify.get('/api/health', async (request, reply) => {
    return reply.send({
      success: true,
      data: { 
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        features: [
          'Volume data integration',
          'Volatility filtering',
          'Price spike detection',
          'Composite scoring',
          'GE tax cap (5M)',
          'Unlimited buy limit support'
        ]
      },
      timestamp: new Date(),
    });
  });
}