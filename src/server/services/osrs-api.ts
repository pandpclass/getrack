import axios from 'axios';
import { OSRSItem, OSRSLatestPrices, OSRSVolumeData } from '../../types/api.js';

/**
 * OSRS API Service
 * 
 * This service handles all interactions with the RuneScape Wiki API,
 * which provides comprehensive market data for Old School RuneScape.
 * 
 * The service includes proper error handling, request timeouts, and
 * follows the API's guidelines for responsible usage.
 */

/**
 * RuneScape Wiki API base URL
 * This is the official API endpoint for OSRS market data
 */
const BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs';

/**
 * User-Agent header for API requests
 * The Wiki API requires a descriptive User-Agent to identify the application
 * This helps them monitor usage and contact developers if needed
 */
const USER_AGENT = 'OSRS-GE-Tracker-BoltNew/1.0 (pandpclass@gmail.com)';

/**
 * Configured Axios instance for API requests
 * Includes default headers, timeout, and base URL configuration
 */
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent': USER_AGENT,
  },
  timeout: 30000, // 30 second timeout for API requests
});

/**
 * OSRS API Service Class
 * 
 * Provides static methods for fetching different types of data from the
 * RuneScape Wiki API. Each method includes proper error handling and
 * returns typed data for use throughout the application.
 */
export class OSRSApiService {
  /**
   * Fetches the complete item mapping from the API
   * 
   * This endpoint provides metadata for all tradeable items including:
   * - Item IDs and names
   * - Buy limits (0 = unlimited)
   * - Icons and examine text
   * - Member status
   * - High/low alchemy values
   * 
   * @returns Promise resolving to array of OSRS items
   * @throws Error if the request fails
   */
  static async fetchItemMapping(): Promise<OSRSItem[]> {
    try {
      const response = await api.get('/mapping');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch item mapping:', error);
      throw new Error('Failed to fetch item mapping from OSRS API');
    }
  }

  /**
   * Fetches the latest price data for all items
   * 
   * This endpoint provides current market prices including:
   * - High (sell) and low (buy) prices
   * - Timestamps for when prices were last updated
   * - Volume data (when available)
   * 
   * @returns Promise resolving to latest price data object
   * @throws Error if the request fails
   */
  static async fetchLatestPrices(): Promise<OSRSLatestPrices> {
    try {
      const response = await api.get('/latest');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch latest prices:', error);
      throw new Error('Failed to fetch latest prices from OSRS API');
    }
  }

  /**
   * Fetches 24-hour trading volume data for all items
   * 
   * This endpoint provides trading volume information for liquidity analysis.
   * Volume data helps identify which items have sufficient trading activity
   * for reliable flipping opportunities.
   * 
   * @returns Promise resolving to 24h volume data
   * @throws Error if the request fails
   */
  static async fetch24hVolumes(): Promise<OSRSVolumeData> {
    try {
      const response = await api.get('/24h');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch 24h volume data:', error);
      throw new Error('Failed to fetch 24h volume data from OSRS API');
    }
  }

  /**
   * Fetches 1-hour trading volume data for all items
   * 
   * This endpoint provides recent trading volume for more immediate
   * liquidity assessment. Useful for detecting current market activity.
   * 
   * @returns Promise resolving to 1h volume data
   * @throws Error if the request fails
   */
  static async fetch1hVolumes(): Promise<OSRSVolumeData> {
    try {
      const response = await api.get('/1h');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch 1h volume data:', error);
      throw new Error('Failed to fetch 1h volume data from OSRS API');
    }
  }

  /**
   * Fetches historical price data for a specific item
   * 
   * This endpoint provides time-series data for price analysis and
   * volatility calculations. Data is available in different time intervals.
   * 
   * @param itemId - The item ID to fetch data for
   * @param timestep - Time interval for data points (default: '5m')
   * @returns Promise resolving to timeseries data
   * @throws Error if the request fails
   */
  static async fetchTimeseries(itemId: number, timestep: string = '5m'): Promise<unknown> {
    try {
      const response = await api.get(`/timeseries?id=${itemId}&timestep=${timestep}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch timeseries for item ${itemId}:`, error);
      throw new Error(`Failed to fetch timeseries for item ${itemId}`);
    }
  }

  /**
   * Fetches volume data for market analysis
   * 
   * This endpoint provides trading volume information which can be used
   * for liquidity analysis and market depth calculations.
   * 
   * @returns Promise resolving to volume data
   * @throws Error if the request fails
   */
  static async fetchVolumes(): Promise<unknown> {
    try {
      const response = await api.get('/5m');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch volume data:', error);
      throw new Error('Failed to fetch volume data from OSRS API');
    }
  }
}