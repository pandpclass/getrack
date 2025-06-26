import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Clock, BarChart3, AlertCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { ItemHistory } from '../types/api';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Props interface for the ItemDetailModal component
 */
interface ItemDetailModalProps {
  itemId: number;
  onClose: () => void;
}

/**
 * Item Detail Modal Component
 * 
 * Displays detailed analysis for a specific item including:
 * - Historical price data and trends
 * - Price volatility analysis
 * - Recent trading activity
 * - Simple price chart visualization
 * 
 * This modal provides deeper insights into individual trading opportunities
 * to help users make informed decisions.
 */
export function ItemDetailModal({ itemId, onClose }: ItemDetailModalProps) {
  const [days, setDays] = useState(7);
  
  // Fetch item history data
  const { data: history, loading, error } = useApi<ItemHistory>(
    `/api/history/${itemId}?days=${days}`,
    [itemId, days]
  );

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  /**
   * Formats numbers with K/M suffixes
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  /**
   * Formats currency with GP suffix
   */
  const formatCurrency = (num: number): string => {
    return `${formatNumber(num)} GP`;
  };

  /**
   * Creates a simple SVG line chart from price data
   */
  const createPriceChart = (prices: any[]) => {
    if (prices.length < 2) return null;

    const width = 400;
    const height = 200;
    const padding = 20;

    // Get price ranges
    const allPrices = prices.flatMap(p => [p.high, p.low].filter(Boolean));
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    // Create points for high and low price lines
    const highPoints = prices
      .filter(p => p.high)
      .map((p, i) => {
        const x = padding + (i / (prices.length - 1)) * (width - 2 * padding);
        const y = padding + ((maxPrice - p.high) / priceRange) * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(' ');

    const lowPoints = prices
      .filter(p => p.low)
      .map((p, i) => {
        const x = padding + (i / (prices.length - 1)) * (width - 2 * padding);
        const y = padding + ((maxPrice - p.low) / priceRange) * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="border rounded">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Price lines */}
        {highPoints && (
          <polyline
            points={highPoints}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
        )}
        {lowPoints && (
          <polyline
            points={lowPoints}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
        )}
        
        {/* Labels */}
        <text x={padding} y={15} className="text-xs fill-gray-600">
          {formatCurrency(maxPrice)}
        </text>
        <text x={padding} y={height - 5} className="text-xs fill-gray-600">
          {formatCurrency(minPrice)}
        </text>
      </svg>
    );
  };

  /**
   * Calculates basic statistics from price data
   */
  const calculateStats = (prices: any[]) => {
    if (prices.length === 0) return null;

    const validHighs = prices.filter(p => p.high).map(p => p.high);
    const validLows = prices.filter(p => p.low).map(p => p.low);

    if (validHighs.length === 0 || validLows.length === 0) return null;

    const avgHigh = validHighs.reduce((sum, price) => sum + price, 0) / validHighs.length;
    const avgLow = validLows.reduce((sum, price) => sum + price, 0) / validLows.length;
    const maxHigh = Math.max(...validHighs);
    const minLow = Math.min(...validLows);
    const currentHigh = validHighs[0];
    const currentLow = validLows[0];

    return {
      avgHigh,
      avgLow,
      maxHigh,
      minLow,
      currentHigh,
      currentLow,
      highVolatility: ((maxHigh - Math.min(...validHighs)) / avgHigh) * 100,
      lowVolatility: ((Math.max(...validLows) - minLow) / avgLow) * 100,
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              {history?.itemName || `Item ${itemId}`} - Detailed Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Time Period Selector */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Price History</h3>
            <div className="flex space-x-2">
              {[1, 3, 7, 14, 30].map(period => (
                <button
                  key={period}
                  onClick={() => setDays(period)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    days === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period}d
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Loading price history...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="w-6 h-6 mr-2" />
              <span>Failed to load price history: {error}</span>
            </div>
          )}

          {/* Data Display */}
          {history && !loading && !error && (
            <div className="space-y-6">
              {/* Price Chart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-800">Price Trends</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                      <span>Sell Price</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                      <span>Buy Price</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  {history.prices.length > 1 ? (
                    createPriceChart(history.prices)
                  ) : (
                    <div className="text-gray-500 py-8">
                      Insufficient data for chart (need at least 2 data points)
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              {(() => {
                const stats = calculateStats(history.prices);
                if (!stats) return null;

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-600">Current High</div>
                      <div className="text-lg font-bold text-blue-900">
                        {formatCurrency(stats.currentHigh)}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-green-600">Current Low</div>
                      <div className="text-lg font-bold text-green-900">
                        {formatCurrency(stats.currentLow)}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-purple-600">Avg High</div>
                      <div className="text-lg font-bold text-purple-900">
                        {formatCurrency(Math.round(stats.avgHigh))}
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-orange-600">Avg Low</div>
                      <div className="text-lg font-bold text-orange-900">
                        {formatCurrency(Math.round(stats.avgLow))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Recent Price Data Table */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Recent Price Data</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Time
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Buy Price
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Sell Price
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.prices.slice(0, 10).map((price, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-gray-400" />
                              {new Date(price.timestamp).toLocaleDateString()} {new Date(price.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-green-600 font-medium">
                            {price.low ? formatCurrency(price.low) : '–'}
                          </td>
                          <td className="px-4 py-2 text-sm text-red-600 font-medium">
                            {price.high ? formatCurrency(price.high) : '–'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {price.high && price.low ? (
                              <span className={price.high - price.low > 0 ? 'text-green-600' : 'text-gray-500'}>
                                {formatCurrency(price.high - price.low)}
                              </span>
                            ) : '–'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Data from RuneScape Wiki API • Prices update every 5 minutes
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}