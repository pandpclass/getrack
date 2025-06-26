import prisma from '../../lib/database.js';
import { OSRSApiService } from './osrs-api.js';
import { FlipOpportunity, PortfolioSuggestion, OSRSItem } from '../../types/api.js';
import {
  calculateMargin,
  calculateMarginPercent,
  calculateROI,
  calculateProfitAfterTax,
  calculateOptimalQuantity,
  calculateVolatility,
  detectPriceAnomalies,
  sortOpportunitiesByScore,
  filterProfitableOpportunities,
  getRiskLevel,
  hassufficientVolume,
  VOLATILITY_THRESHOLDS,
} from '../../lib/calculations.js';

/**
 * Price Service
 * 
 * Enhanced service that handles all business logic related to price data management,
 * trading opportunity analysis, and portfolio optimization. Now includes volume data
 * integration, volatility filtering, and improved scoring algorithms.
 * 
 * Key responsibilities:
 * - Synchronizing data from external APIs (prices + volumes)
 * - Calculating trading opportunities with liquidity and stability filters
 * - Generating optimized portfolio recommendations with composite scoring
 * - Managing database operations for price and item data
 */
export class PriceService {
  /**
   * Synchronizes item metadata from the OSRS API
   * 
   * This method fetches the complete item mapping and updates the local database
   * with the latest item information including names, buy limits (0 = unlimited),
   * icons, and other metadata. It uses upsert operations to handle both new items and updates.
   * 
   * @throws Error if synchronization fails
   */
  static async syncItems(): Promise<void> {
    try {
      console.log('Syncing items from OSRS API...');
      const items = await OSRSApiService.fetchItemMapping();
      
      // Process each item with upsert to handle both new and existing items
      for (const item of items) {
        await prisma.item.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            buyLimit: item.limit || 0, // 0 = unlimited buy limit
            icon: item.icon,
            examine: item.examine,
            members: item.members || false,
            lowalch: item.lowalch,
            highalch: item.highalch,
          },
          create: {
            id: item.id,
            name: item.name,
            buyLimit: item.limit || 0, // 0 = unlimited buy limit
            icon: item.icon,
            examine: item.examine,
            members: item.members || false,
            lowalch: item.lowalch,
            highalch: item.highalch,
          },
        });
      }
      
      console.log(`Synced ${items.length} items successfully`);
    } catch (error) {
      console.error('Failed to sync items:', error);
      throw error;
    }
  }

  /**
   * Synchronizes current price data from the OSRS API
   * 
   * This method fetches the latest market prices and stores them in the database
   * for historical tracking and analysis. It only stores prices for items that
   * have valid high or low price data.
   * 
   * @throws Error if synchronization fails
   */
  static async syncPrices(): Promise<void> {
    try {
      console.log('Syncing prices from OSRS API...');
      const prices = await OSRSApiService.fetchLatestPrices();
      // Load item mapping once to handle newly introduced items
      let itemMapping = await OSRSApiService.fetchItemMapping();
      let mappingById: Record<number, OSRSItem> = {};
      for (const item of itemMapping) {
        mappingById[item.id] = item;
      }
      let mappingRefetched = false;
      
      // Process each item's price data
      for (const [itemIdStr, priceData] of Object.entries(prices)) {
        const itemId = parseInt(itemIdStr);
        
        // Skip items without valid price data
        if (!priceData.high && !priceData.low) continue;
        
        // Ensure item exists before inserting price (avoid foreign key violation)
        const existingItem = await prisma.item.findUnique({
          where: { id: itemId },
        });

        // If item doesn't exist, attempt to create it from the mapping
        if (!existingItem) {
          let mapped = mappingById[itemId];
          if (!mapped && !mappingRefetched) {
            console.warn(
              `Unknown item ${itemId} encountered during price sync. Attempting item sync...`
            );
            await PriceService.syncItems();
            itemMapping = await OSRSApiService.fetchItemMapping();
            mappingById = {};
            for (const item of itemMapping) {
              mappingById[item.id] = item;
            }
            mappingRefetched = true;
            mapped = mappingById[itemId];
          }

          if (mapped) {
            await prisma.item.upsert({
              where: { id: mapped.id },
              update: {
                name: mapped.name,
                buyLimit: mapped.limit || 0,
                icon: mapped.icon,
                examine: mapped.examine,
                members: mapped.members || false,
                lowalch: mapped.lowalch,
                highalch: mapped.highalch,
              },
              create: {
                id: mapped.id,
                name: mapped.name,
                buyLimit: mapped.limit || 0,
                icon: mapped.icon,
                examine: mapped.examine,
                members: mapped.members || false,
                lowalch: mapped.lowalch,
                highalch: mapped.highalch,
              },
            });
          } else {
            console.error(
              `Item ID ${itemId} still missing after sync. Skipping price insert.`
            );
            continue;
          }
        }

        // Create new price record with timestamp
        await prisma.price.create({
          data: {
            itemId,
            high: priceData.high || null,
            low: priceData.low || null,
            highTime: priceData.highTime ? new Date(priceData.highTime * 1000) : null,
            lowTime: priceData.lowTime ? new Date(priceData.lowTime * 1000) : null,
          },
        });

      }
      
      console.log(`Synced prices for ${Object.keys(prices).length} items`);
    } catch (error) {
      console.error('Failed to sync prices:', error);
      throw error;
    }
  }

  /**
   * Fetches and caches volume data from OSRS API
   * 
   * This method retrieves 24-hour trading volume data for liquidity analysis.
   * Volume data is used to filter out illiquid items and improve opportunity scoring.
   * 
   * @returns Object mapping item IDs to their 24h trading volumes
   */
  static async fetchVolumeData(): Promise<Record<number, number>> {
  try {
    console.log('Fetching volume data from OSRS API...');
    const volumeData = await OSRSApiService.fetch24hVolumes();

    console.log('Raw volume data keys:', Object.keys(volumeData));

    const processedVolumes: Record<number, number> = {};

    for (const [itemIdStr, volumes] of Object.entries(volumeData)) {
      const itemId = parseInt(itemIdStr);
      const totalVolume =
        (volumes.highPriceVolume || 0) + (volumes.lowPriceVolume || 0);

      if (totalVolume > 0) {
        processedVolumes[itemId] = totalVolume;
      }
    }


    console.log(`Processed volume data for ${Object.keys(processedVolumes).length} items`);
    return processedVolumes;
  } catch (error) {
    console.error('Failed to fetch volume data:', error);
    return {};
  }
}

  /**
   * Synchronizes historical prices using the 1h endpoint
   *
   * Pulls recent hourly price data for the most traded items to
   * bootstrap the PriceHistory table. This runs once on startup
   * or whenever new items without history are detected.
   */
  static async syncHistoricalPrices(): Promise<void> {
    try {
      const historyDone = process.env.HISTORICAL_SYNC_DONE === 'true';

      // Determine which items don't have any history records yet
      const items = await prisma.item.findMany({ select: { id: true } });
      const historyItems = await prisma.priceHistory.findMany({
        distinct: ['itemId'],
        select: { itemId: true },
      });
      const historySet = new Set(historyItems.map(h => h.itemId));
      const missingHistory = items.filter(i => !historySet.has(i.id));

      if (historyDone && missingHistory.length === 0) {
        console.log('Historical sync already performed, skipping');
        return;
      }

      console.log('Syncing historical prices...');

      const volumeData = await this.fetchVolumeData();
      const topIds = Object.entries(volumeData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100)
        .map(([id]) => parseInt(id));

      const targetIds = historyDone
        ? topIds.filter(id => missingHistory.some(m => m.id === id))
        : topIds;

      for (const itemId of targetIds) {
        const records = await OSRSApiService.fetch1hHistory(itemId);
        const data = records.map(r => ({
          itemId,
          avgHigh: r.avgHighPrice ?? null,
          avgLow: r.avgLowPrice ?? null,
          volume: (r.highPriceVolume || 0) + (r.lowPriceVolume || 0),
          date: new Date(r.timestamp * 1000),
        }));

        if (data.length > 0) {
          await prisma.priceHistory.createMany({ data });
        }
      }

      process.env.HISTORICAL_SYNC_DONE = 'true';
      console.log('Historical price sync complete');
    } catch (error) {
      console.error('Failed to sync historical prices:', error);
    }
  }


  /**
   * Generates trading opportunities with enhanced filtering and scoring
   * 
   * This method analyzes all items with recent price data to identify profitable
   * trading opportunities. It now includes volume filtering, volatility checks,
   * price spike detection, and composite scoring for better recommendations.
   * 
   * @param budget - Available trading budget in GP
   * @returns Array of profitable trading opportunities, sorted by composite score
   * @throws Error if analysis fails
   */
  static async getFlipOpportunities(
    budget: number,
    {
      minVolume = 0,
      maxVolatility = VOLATILITY_THRESHOLDS.EXTREME,
      includeSpikes = false,
      includeHighRisk = false,
    }: { minVolume?: number; maxVolatility?: number; includeSpikes?: boolean; includeHighRisk?: boolean } = {}
  ): Promise<FlipOpportunity[]> {
  try {
    const volumeData = await this.fetchVolumeData();

    const items = await prisma.item.findMany({
      include: {
        prices: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
      where: {
        prices: {
          some: {},
        },
      },
    });

    const opportunities: FlipOpportunity[] = [];

    for (const item of items) {
      if (item.prices.length === 0) continue;

      const latestPrice = item.prices[0];
      if (!latestPrice.high || !latestPrice.low) continue;

      const volume = volumeData[item.id] || 0;

      if (!hassufficientVolume(volume, latestPrice.high)) continue;

      const avgPrice = (latestPrice.high + latestPrice.low) / 2;
      const margin = calculateMargin(latestPrice.high, latestPrice.low);
      const marginPercent = calculateMarginPercent(margin, latestPrice.low);

      if (margin <= 0 || avgPrice <= 0) continue;

      const recentHighs = item.prices
        .slice(0, 10)
        .map(p => p.high || 0)
        .filter(p => p > 0);

      const recentLows = item.prices
        .slice(0, 10)
        .map(p => p.low || 0)
        .filter(p => p > 0);

      const volatility = calculateVolatility(recentHighs);
      const riskLevel = getRiskLevel(volatility);

      if (!includeHighRisk && volatility > 25) continue;
      if (volatility > VOLATILITY_THRESHOLDS.EXTREME) continue;

      const priceAnalysis = detectPriceAnomalies(
        latestPrice.high,
        latestPrice.low,
        recentHighs,
        recentLows
      );
      if (!includeSpikes && !priceAnalysis.isStable) continue;

      const quantity = calculateOptimalQuantity(
        budget,
        avgPrice,
        item.buyLimit,
        volume
      );

      if (quantity === 0) continue;

      const totalCost = quantity * latestPrice.low;
      const totalProfit = quantity * margin;
      const profitAfterTax = calculateProfitAfterTax(margin, latestPrice.high, quantity);
      const roi = calculateROI(profitAfterTax, totalCost);

      opportunities.push({
        id: item.id,
        name: item.name,
        icon: item.icon || undefined,
        currentHigh: latestPrice.high,
        currentLow: latestPrice.low,
        avgPrice,
        margin,
        marginPercent,
        roi,
        quantity,
        totalCost,
        totalProfit,
        profitAfterTax,
        buyLimit: item.buyLimit,
        volume,
        volatility,
        riskLevel,
        isStable: priceAnalysis.isStable,
        lastUpdated: latestPrice.timestamp,
      });
    }

    // You can still filter and sort — this is usually safe
    const profitableOpportunities = filterProfitableOpportunities(
      opportunities,
      1000,
      5,
      minVolume,
      maxVolatility
    );

    if (budget > 100000000) {
      // For very large budgets, prioritize high ROI opportunities
      return profitableOpportunities.sort((a, b) => b.roi - a.roi);
    }

    return sortOpportunitiesByScore(profitableOpportunities);
  } catch (error) {
    console.error('Failed to get flip opportunities:', error);
    throw error;
  }
}


  /**
   * Generates an optimized portfolio recommendation with improved allocation
   * 
   * This method creates a comprehensive trading portfolio by selecting the best
   * opportunities that fit within the user's budget. It now uses composite scoring,
   * limits to 8 items (GE slot limit), and removes artificial budget caps per item.
   * 
   * @param budget - Available trading budget in GP
   * @returns Complete portfolio suggestion with metrics and selected opportunities
   * @throws Error if portfolio generation fails
   */
  static async getPortfolioSuggestion(
    budget: number,
    filters: { minVolume?: number; maxVolatility?: number; includeSpikes?: boolean; includeHighRisk?: boolean } = {}
  ): Promise<PortfolioSuggestion> {
    try {
      // Get all available trading opportunities (already scored and filtered)
      const opportunities = await this.getFlipOpportunities(budget, filters);
      
      let remainingBudget = budget;
      const selectedOpportunities: FlipOpportunity[] = [];
      const maxItems = 8; // GE slot limit
      
      // Enhanced selection algorithm: pick best opportunities up to slot limit
      for (const opportunity of opportunities) {
        if (remainingBudget <= 0 || selectedOpportunities.length >= maxItems) break;
        
        // For unlimited buy limit items, calculate quantity based on remaining budget
        // and volume constraints rather than artificial caps
        let adjustedQuantity: number;
        
          if (opportunity.buyLimit === 0) {
            // Unlimited buy limit - use budget and volume constraints
            // Relax the volume cap when we still have a large amount of GP
            const volumeMultiplier = remainingBudget > budget * 0.5 ? 0.2 : 0.1;
            adjustedQuantity = Math.min(
              Math.floor(remainingBudget / opportunity.currentLow),
              Math.floor(opportunity.volume * volumeMultiplier)
            );
        } else {
          // Normal buy limit - respect the limit
          adjustedQuantity = Math.min(
            opportunity.quantity,
            Math.floor(remainingBudget / opportunity.currentLow)
          );
        }
        
        // Only include if we can afford at least one item
        if (adjustedQuantity > 0) {
          // Recalculate metrics for adjusted quantity
          const adjustedOpportunity = {
            ...opportunity,
            quantity: adjustedQuantity,
            totalCost: adjustedQuantity * opportunity.currentLow,
            totalProfit: adjustedQuantity * opportunity.margin,
            profitAfterTax: calculateProfitAfterTax(
              opportunity.margin,
              opportunity.currentHigh,
              adjustedQuantity
            ),
          };
          
          // Recalculate ROI for adjusted investment
          adjustedOpportunity.roi = calculateROI(
            adjustedOpportunity.profitAfterTax,
            adjustedOpportunity.totalCost
          );
          
          selectedOpportunities.push(adjustedOpportunity);
          remainingBudget -= adjustedOpportunity.totalCost;
        }
      }
      
      // Calculate portfolio-wide metrics
      const totalCost = selectedOpportunities.reduce((sum, opp) => sum + opp.totalCost, 0);
      const totalProfit = selectedOpportunities.reduce((sum, opp) => sum + opp.totalProfit, 0);
      const totalProfitAfterTax = selectedOpportunities.reduce((sum, opp) => sum + opp.profitAfterTax, 0);
      const totalROI = calculateROI(totalProfitAfterTax, totalCost);
      const budgetUtilization = (totalCost / budget) * 100;
      
      return {
        totalBudget: budget,
        totalCost,
        totalProfit,
        totalProfitAfterTax,
        totalROI,
        opportunities: selectedOpportunities,
        itemCount: selectedOpportunities.length,
        budgetUtilization,
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to get portfolio suggestion:', error);
      throw error;
    }
  }

  /**
   * Fetches historical price data for a specific item
   * 
   * This method retrieves recent price history for detailed analysis and charting.
   * Used by the frontend for displaying item-specific price trends.
   * 
   * @param itemId - The item ID to fetch history for
   * @param days - Number of days of history to retrieve (default: 7)
   * @returns Historical price data for the item
   */
  static async getItemHistory(
    itemId: number,
    days: number = 7
  ): Promise<{
    itemId: number;
    itemName: string;
    prices: { timestamp: Date; high?: number | null; low?: number | null }[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
          prices: {
            where: {
              timestamp: {
                gte: startDate,
              },
            },
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      if (!item) {
        throw new Error(`Item with ID ${itemId} not found`);
      }

      return {
        itemId: item.id,
        itemName: item.name,
        prices: item.prices.map(price => ({
          timestamp: price.timestamp,
          high: price.high,
          low: price.low,
        })),
      };
    } catch (error) {
      console.error(`Failed to get item history for ${itemId}:`, error);
      throw error;
    }
  }
}