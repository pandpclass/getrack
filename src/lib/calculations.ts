import { FlipOpportunity } from '../types/api.js';

/**
 * Trading Calculations Library
 * 
 * This module contains all the mathematical functions used for calculating
 * trading profits, margins, ROI, and other financial metrics for OSRS items.
 * 
 * All calculations take into account the Grand Exchange tax system with the
 * 5M GP tax cap and provide accurate profit projections for trading decisions.
 */

/**
 * Grand Exchange tax rate (2% of sell price)
 * This tax is applied to all items sold on the GE
 */
export const GE_TAX_RATE = 0.02;

/**
 * Maximum Grand Exchange tax per transaction (5M GP cap)
 * OSRS has a tax cap of 5,000,000 GP per transaction
 */
export const MAX_GE_TAX = 5000000;

/**
 * Minimum volume thresholds for filtering illiquid items
 */
export const MIN_VOLUME_THRESHOLDS = {
  HOURLY: 50,    // Minimum trades per hour
  DAILY: 1200,   // Minimum trades per 24 hours
};

/**
 * Volatility thresholds for risk assessment and filtering
 */
export const VOLATILITY_THRESHOLDS = {
  LOW: 5,        // < 5% volatility = low risk
  MEDIUM: 15,    // 5-15% volatility = medium risk
  HIGH: 20,      // > 20% volatility = high risk (may be filtered)
  EXTREME: 30,   // > 30% volatility = extreme risk (always filtered)
};

/**
 * Price spike detection thresholds
 */
export const PRICE_SPIKE_THRESHOLDS = {
  HIGH_MULTIPLIER: 1.5,  // Current high > 1.5x recent average = potential spike
  LOW_MULTIPLIER: 0.5,   // Current low < 0.5x recent average = potential crash
};

/**
 * Maximum margin percentage allowed for opportunities
 * Used to filter out data anomalies and unrealistic ROI
 */
export const MAX_MARGIN_PERCENT = 1000;

/**
 * Calculates the raw margin between high and low prices
 * 
 * @param high - Sell price (high price)
 * @param low - Buy price (low price)
 * @returns Raw profit margin per item
 */
export function calculateMargin(high: number, low: number): number {
  return high - low;
}

/**
 * Calculates margin as a percentage of the buy price
 * 
 * @param margin - Raw margin amount
 * @param low - Buy price (low price)
 * @returns Margin percentage
 */
export function calculateMarginPercent(margin: number, low: number): number {
  if (low === 0) return 0;
  return (margin / low) * 100;
}

/**
 * Calculates Return on Investment (ROI) percentage
 * 
 * @param profit - Net profit amount
 * @param cost - Total investment cost
 * @returns ROI as a percentage
 */
export function calculateROI(profit: number, cost: number): number {
  if (cost === 0) return 0;
  return (profit / cost) * 100;
}

/**
 * Calculates the Grand Exchange tax for a given sell price
 * 
 * The GE tax is 2% of the sell price, with a minimum of 1 GP per item
 * and a maximum of 5,000,000 GP per transaction (OSRS tax cap).
 * This function replicates the exact tax calculation used in-game.
 * 
 * @param sellPrice - The price at which the item is sold
 * @returns Tax amount per item (minimum 1 GP, maximum 5M GP)
 */
export function calculateGETax(sellPrice: number): number {
  const tax = Math.floor(sellPrice * GE_TAX_RATE);
  return Math.min(Math.max(tax, 1), MAX_GE_TAX);
}

/**
 * Calculates net profit after Grand Exchange tax
 * 
 * This is the most important calculation as it provides the actual
 * profit a player will receive after selling items on the GE.
 * 
 * @param margin - Raw margin per item (before tax)
 * @param high - Sell price (for tax calculation)
 * @param quantity - Number of items being traded
 * @returns Net profit after GE tax deduction
 */
export function calculateProfitAfterTax(margin: number, high: number, quantity: number): number {
  const taxPerItem = calculateGETax(high);
  const profitPerItem = margin - taxPerItem;
  return profitPerItem * quantity;
}

/**
 * Calculates price volatility from historical price data
 * 
 * Volatility is measured as the coefficient of variation (standard deviation
 * divided by mean) expressed as a percentage. Higher values indicate more
 * price instability and higher trading risk.
 * 
 * @param prices - Array of historical prices
 * @returns Volatility percentage (0 if insufficient data)
 */
export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  // Calculate mean price
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  // Calculate variance
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  
  // Calculate standard deviation
  const standardDeviation = Math.sqrt(variance);
  
  // Return coefficient of variation as percentage
  return mean > 0 ? (standardDeviation / mean) * 100 : 0;
}

/**
 * Detects potential price spikes or crashes by comparing current prices to recent averages
 * 
 * @param currentHigh - Current sell price
 * @param currentLow - Current buy price
 * @param recentHighs - Array of recent high prices
 * @param recentLows - Array of recent low prices
 * @returns Object indicating if price spike/crash is detected
 */
export function detectPriceAnomalies(
  currentHigh: number,
  currentLow: number,
  recentHighs: number[],
  recentLows: number[]
): { hasSpike: boolean; hasCrash: boolean; isStable: boolean } {
  if (recentHighs.length < 3 || recentLows.length < 3) {
    return { hasSpike: false, hasCrash: false, isStable: true };
  }

  // Calculate recent averages (excluding current price)
  const avgRecentHigh = recentHighs.slice(1).reduce((sum, price) => sum + price, 0) / (recentHighs.length - 1);
  const avgRecentLow = recentLows.slice(1).reduce((sum, price) => sum + price, 0) / (recentLows.length - 1);

  // Detect spikes and crashes
  const hasSpike = currentHigh > avgRecentHigh * PRICE_SPIKE_THRESHOLDS.HIGH_MULTIPLIER;
  const hasCrash = currentLow < avgRecentLow * PRICE_SPIKE_THRESHOLDS.LOW_MULTIPLIER;
  const isStable = !hasSpike && !hasCrash;

  return { hasSpike, hasCrash, isStable };
}

/**
 * Calculates optimal quantity to purchase based on various constraints
 * 
 * This function considers multiple factors to determine the best quantity:
 * - Available budget
 * - Item buy limits (GE restrictions) - treats 0 as unlimited
 * - Volume-based liquidity constraints
 * - Price per item
 * 
 * @param budget - Total available budget
 * @param avgPrice - Average price per item
 * @param buyLimit - GE buy limit for this item (0 = unlimited)
 * @param volume - Recent trading volume for liquidity assessment
 * @param maxBudgetPercent - Maximum percentage of budget to allocate (default 100% - removed artificial cap)
 * @returns Optimal quantity to purchase
 */
export function calculateOptimalQuantity(
  budget: number,
  avgPrice: number,
  buyLimit: number,
  volume: number = 0,
  maxBudgetPercent: number = 1.0  // Removed artificial 10% cap
): number {
  // Calculate maximum budget allocation for this item
  const maxBudgetForItem = budget * maxBudgetPercent;
  
  // Calculate quantity limits based on different constraints
  const maxQuantityByBudget = Math.floor(maxBudgetForItem / avgPrice);
  const maxQuantityByPrice = Math.floor(budget / avgPrice);
  
  // Handle buy limit: 0 means unlimited (infinite)
  const effectiveBuyLimit = buyLimit === 0 ? Number.MAX_SAFE_INTEGER : buyLimit;
  
  // Consider volume for liquidity (don't buy more than recent volume suggests is liquid)
  // Use a conservative approach: don't exceed 10% of recent daily volume
  const volumeBasedLimit = volume > 0 ? Math.max(1, Math.floor(volume * 0.1)) : Number.MAX_SAFE_INTEGER;
  
  // Return the most restrictive limit
  return Math.min(effectiveBuyLimit, maxQuantityByBudget, maxQuantityByPrice, volumeBasedLimit);
}

/**
 * Calculates a composite score for ranking opportunities
 * 
 * This scoring system balances profitability, liquidity, and ROI to provide
 * better recommendations than simple profit-based sorting.
 * 
 * @param opportunities - Array of opportunities to score
 * @returns Array with calculated scores
 */
export function calculateOpportunityScores(opportunities: FlipOpportunity[]): FlipOpportunity[] {
  if (opportunities.length === 0) return opportunities;

  // Calculate ranks for each metric (lower rank = better)
  const sortedByProfit = [...opportunities].sort((a, b) => b.profitAfterTax - a.profitAfterTax);
  const sortedByVolume = [...opportunities].sort((a, b) => b.volume - a.volume);
  const sortedByROI = [...opportunities].sort((a, b) => b.roi - a.roi);

  // Assign normalized scores (0-1, higher is better)
  return opportunities.map(opp => {
    const profitRank = sortedByProfit.findIndex(o => o.id === opp.id);
    const volumeRank = sortedByVolume.findIndex(o => o.id === opp.id);
    const roiRank = sortedByROI.findIndex(o => o.id === opp.id);

    const profitScore = 1 - (profitRank / opportunities.length);
    const volumeScore = 1 - (volumeRank / opportunities.length);
    const roiScore = 1 - (roiRank / opportunities.length);

    // Weighted composite score: profit 50%, volume 30%, ROI 20%
    const compositeScore = (profitScore * 0.5) + (volumeScore * 0.3) + (roiScore * 0.2);

    return {
      ...opp,
      compositeScore
    };
  });
}

/**
 * Sorts trading opportunities by composite score (descending)
 * 
 * @param opportunities - Array of flip opportunities
 * @returns Sorted array with highest scoring opportunities first
 */
export function sortOpportunitiesByScore(opportunities: FlipOpportunity[]): FlipOpportunity[] {
  const scoredOpportunities = calculateOpportunityScores(opportunities);
  return scoredOpportunities.sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));
}

/**
 * Filters opportunities to only include profitable and liquid trades
 * 
 * This function applies multiple filters to ensure only worthwhile
 * trading opportunities are presented to users:
 * - Minimum profit thresholds
 * - Minimum ROI requirements
 * - Volume/liquidity requirements
 * - Volatility limits
 * - Price stability checks
 * 
 * @param opportunities - Array of all opportunities
 * @param minProfit - Minimum profit threshold (default: 1000 GP)
 * @param minROI - Minimum ROI threshold (default: 5%)
 * @param minVolume - Minimum volume threshold (default: 50 trades/day)
 * @returns Filtered array of profitable and stable opportunities
 */
export function filterProfitableOpportunities(
  opportunities: FlipOpportunity[],
  minProfit: number = 1000,
  minROI: number = 5,
  minVolume: number = 0,
  maxVolatility: number = VOLATILITY_THRESHOLDS.EXTREME
): FlipOpportunity[] {
  return opportunities.filter(opp => {
    // Basic profitability filters
    if (opp.profitAfterTax < minProfit || opp.roi < minROI) {
      return false;
    }

    // Skip unrealistic opportunities with extremely high margin percentages
    if (opp.marginPercent > MAX_MARGIN_PERCENT) {
      return false;
    }

    // Price-adjusted liquidity filter
    if (!hassufficientVolume(opp.volume, opp.currentHigh)) {
      return false;
    }

    // Additional user-specified volume filter
    if (minVolume > 0 && opp.volume < minVolume) {
      return false;
    }

    // Volatility filter
    if (opp.volatility > maxVolatility) {
      return false;
    }

    // All filters passed
    return true;
  });
}

/**
 * Checks if an item has sufficient volume for trading
 * 
 * @param volume - Trading volume
 * @param itemPrice - Item price (for price-adjusted thresholds)
 * @returns Whether the item has sufficient liquidity
 */
export function hassufficientVolume(volume: number, itemPrice: number): boolean {
  // Lower volume tolerance for expensive items
  const threshold = itemPrice > 1000000 ? MIN_VOLUME_THRESHOLDS.HOURLY : MIN_VOLUME_THRESHOLDS.DAILY;
  return volume >= threshold;
}

/**
 * Gets risk level based on volatility percentage
 * 
 * @param volatility - Volatility percentage
 * @returns Risk level string
 */
export function getRiskLevel(volatility: number): 'Low' | 'Medium' | 'High' | 'Extreme' {
  if (volatility < VOLATILITY_THRESHOLDS.LOW) return 'Low';
  if (volatility < VOLATILITY_THRESHOLDS.MEDIUM) return 'Medium';
  if (volatility < VOLATILITY_THRESHOLDS.HIGH) return 'High';
  return 'Extreme';
}