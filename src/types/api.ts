/**
 * API Type Definitions
 * 
 * This module contains all TypeScript interfaces and types used throughout
 * the OSRS Grand Exchange Tracker application. These types ensure type safety
 * between the frontend, backend, and external API integrations.
 * 
 * The types are organized by their primary use case:
 * - External API response types (OSRS Wiki API)
 * - Internal application data types
 * - API response wrapper types
 */

/**
 * OSRS Item Interface
 * 
 * Represents an item from the RuneScape Wiki API mapping endpoint.
 * Contains all metadata about tradeable items in Old School RuneScape.
 */
export interface OSRSItem {
  id: number;          // Unique item identifier
  name: string;        // Display name of the item
  examine?: string;    // In-game examine text (optional)
  members?: boolean;   // Whether item requires membership (optional)
  lowalch?: number;    // Low alchemy value in GP (optional)
  highalch?: number;   // High alchemy value in GP (optional)
  limit?: number;      // Grand Exchange buy limit (optional, 0 = unlimited)
  icon?: string;       // URL to item icon image (optional)
}

/**
 * OSRS Price Interface
 * 
 * Represents price data for a single item from the latest prices endpoint.
 * Contains current market prices and timestamps for when they were recorded.
 */
export interface OSRSPrice {
  high?: number;       // Current sell (high) price in GP (optional)
  low?: number;        // Current buy (low) price in GP (optional)
  highTime?: number;   // Unix timestamp of last high price update (optional)
  lowTime?: number;    // Unix timestamp of last low price update (optional)
}

/**
 * OSRS Latest Prices Interface
 * 
 * Represents the complete response from the latest prices API endpoint.
 * Maps item IDs (as strings) to their current price data.
 */
export interface OSRSLatestPrices {
  [itemId: string]: OSRSPrice;
}

/**
 * OSRS Volume Data Interface
 * 
 * Represents trading volume data for items from the volume endpoints.
 */
export interface OSRSVolumeData {
  [itemId: string]: {
    highPriceVolume?: number; // Volume of high price trades
    lowPriceVolume?: number;  // Volume of low price trades
  };
}

/**
 * Hourly historical price entry returned from the /1h endpoint
 */
export interface OSRS1hPriceEntry {
  timestamp: number;
  avgHighPrice?: number | null;
  avgLowPrice?: number | null;
  highPriceVolume?: number;
  lowPriceVolume?: number;
}

/**
 * Flip Opportunity Interface
 * 
 * Represents a calculated trading opportunity with all relevant metrics.
 * This is the core data structure for displaying trading recommendations.
 */
export interface FlipOpportunity {
  id: number;              // Item ID
  name: string;            // Item name
  icon?: string;           // Item icon URL (optional)
  currentHigh: number;     // Current sell price
  currentLow: number;      // Current buy price
  avgPrice: number;        // Average of high and low prices
  margin: number;          // Raw profit margin per item
  marginPercent: number;   // Margin as percentage of buy price
  roi: number;             // Return on investment percentage
  quantity: number;        // Recommended purchase quantity
  totalCost: number;       // Total investment required
  totalProfit: number;     // Total gross profit
  profitAfterTax: number;  // Total net profit after GE tax
  buyLimit: number;        // GE buy limit for this item (0 = unlimited)
  volume: number;          // Recent trading volume (24h)
  volatility: number;      // Price volatility percentage
  lastUpdated: Date;       // When price data was last updated
  compositeScore?: number; // Calculated composite score for ranking
  riskLevel?: string;      // Risk assessment (Low/Medium/High/Extreme)
  isStable?: boolean;      // Whether prices are stable (no spikes/crashes)
}

/**
 * Portfolio Suggestion Interface
 * 
 * Represents a complete optimized trading portfolio with selected opportunities
 * and aggregate metrics. This is returned by the portfolio recommendation endpoint.
 */
export interface PortfolioSuggestion {
  totalBudget: number;         // User's specified budget
  totalCost: number;           // Total cost of selected opportunities
  totalProfit: number;         // Total gross profit across all items
  totalProfitAfterTax: number; // Total net profit after GE tax
  totalROI: number;            // Portfolio-wide return on investment
  opportunities: FlipOpportunity[]; // Selected trading opportunities (max 8)
  updatedAt: Date;             // When this portfolio was generated
  itemCount: number;           // Number of different items selected
  budgetUtilization: number;   // Percentage of budget used
}

/**
 * Item History Interface
 * 
 * Represents historical price data for a specific item.
 * Used for detailed analysis and charting.
 */
export interface ItemHistory {
  itemId: number;
  itemName: string;
  prices: {
    timestamp: Date;
    high?: number;
    low?: number;
  }[];
}

/**
 * API Response Wrapper Interface
 * 
 * Standardized response format for all API endpoints. Provides consistent
 * structure for success/error handling and includes metadata like timestamps.
 * 
 * @template T - The type of data being returned
 */
export interface ApiResponse<T> {
  success: boolean;    // Whether the request was successful
  data?: T;           // Response data (present on success)
  error?: string;     // Error message (present on failure)
  timestamp: Date;    // When the response was generated
}