import cron from 'node-cron';
import { PriceService } from '../services/price-service.js';

/**
 * Price Synchronization Job Manager
 * 
 * This class manages all scheduled background jobs for keeping market data current.
 * It handles both regular price updates and item metadata synchronization using
 * cron-based scheduling with proper error handling and concurrency control.
 * 
 * The job scheduler ensures data freshness while respecting API rate limits
 * and preventing overlapping executions that could cause resource conflicts.
 */
export class PriceSyncJob {
  /**
   * Flag to prevent concurrent price sync operations
   * This prevents multiple sync jobs from running simultaneously
   */
  private static isRunning = false;

  /**
   * Starts all scheduled background jobs
   * 
   * This method sets up cron jobs for:
   * - Price synchronization every 5 minutes
   * - Item metadata synchronization every hour
   * 
   * The scheduling ensures fresh data while being respectful of external APIs
   */
  static start(): void {
    console.log('Starting price sync job scheduler...');
    
    /**
     * Price Synchronization Job
     * 
     * Runs every 5 minutes to fetch the latest market prices.
     * This frequency provides near real-time data while respecting
     * the API's rate limits and avoiding excessive requests.
     * 
     
     */
    cron.schedule('*/5 * * * *', async () => {
      // Prevent concurrent executions
      if (this.isRunning) {
        console.log('Price sync already running, skipping...');
        return;
      }

      this.isRunning = true;
      try {
        console.log('Starting scheduled price sync...');
        await PriceService.syncPrices();
        console.log('Scheduled price sync completed successfully');
      } catch (error) {
        console.error('Scheduled price sync failed:', error);
      } finally {
        this.isRunning = false;
      }
    });

    /**
     * Item Metadata Synchronization Job
     * 
     * Runs every hour to update item information like names, buy limits,
     * and icons. This data changes less frequently than prices, so hourly
     * updates are sufficient to keep metadata current.
     * 
     * Cron pattern: '0 * * * *' = at the start of every hour
     */
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('Starting scheduled item sync...');
        await PriceService.syncItems();
        await PriceService.syncHistoricalPrices();
        console.log('Scheduled item sync completed successfully');
      } catch (error) {
        console.error('Scheduled item sync failed:', error);
      }
    });

    console.log('Price sync job scheduler started successfully');
  }

  /**
   * Runs initial data synchronization on application startup
   * 
   * This method ensures the database has current data when the application
   * starts, especially important for fresh installations or after extended
   * downtime. It synchronizes both items and prices in the correct order.
   * 
   * @throws Error if initial sync fails
   */
  static async runInitialSync(): Promise<void> {
    console.log('Running initial data sync...');
    try {
      // Sync items first (required for price data relationships)
      await PriceService.syncItems();
      
      // Then sync current prices
      await PriceService.syncPrices();

      // Populate historical data if needed
      await PriceService.syncHistoricalPrices();
      
      console.log('Initial data sync completed successfully');
    } catch (error) {
      console.error('Initial data sync failed:', error);
      throw error;
    }
  }
}