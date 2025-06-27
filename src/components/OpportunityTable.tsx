import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Info, BarChart3 } from 'lucide-react';
import { FlipOpportunity } from '../types/api';
import { ItemDetailModal } from './ItemDetailModal';

/**
 * Props interface for the OpportunityTable component
 */
interface OpportunityTableProps {
  opportunities: FlipOpportunity[];  // Array of trading opportunities to display
  loading?: boolean;                 // Loading state indicator
}

/**
 * Enhanced Opportunity Table Component
 * 
 * Displays a comprehensive table of trading opportunities with detailed analysis.
 * Now includes volume data, improved risk indicators, and item detail modals.
 * 
 * New features:
 * - Volume column showing 24h trading activity
 * - Enhanced risk indicators with tooltips
 * - Clickable rows for detailed item analysis
 * - Better formatting for unlimited buy limits
 * - Improved mobile responsiveness
 */
export function OpportunityTable({ opportunities, loading }: OpportunityTableProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<keyof FlipOpportunity>('profitAfterTax');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedOpportunities = useMemo(() => {
    const items = [...opportunities];
    items.sort((a, b) => {
      const valA = a[sortKey] as number | undefined;
      const valB = b[sortKey] as number | undefined;
      if (valA === undefined || valB === undefined) return 0;
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
    return items;
  }, [opportunities, sortKey, sortDirection]);

  const handleSort = (key: keyof FlipOpportunity) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  /**
   * Formats large numbers with K/M suffixes for better readability
   * Used throughout the table for consistent number display
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
   * Formats numbers as currency with GP suffix
   */
  const formatCurrency = (num: number): string => {
    return `${formatNumber(num)} GP`;
  };

  /**
   * Formats percentages with one decimal place
   */
  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  /**
   * Formats buy limits with special handling for unlimited (0)
   */
  const formatBuyLimit = (limit: number): string => {
    if (limit === 0) return '∞'; // Infinity symbol for unlimited
    return formatNumber(limit);
  };

  /**
   * Determines the appropriate color class for volatility display
   * Enhanced with more granular risk levels
   */
  const getVolatilityColor = (volatility: number): string => {
    if (volatility < 5) return 'text-green-600';      // Low volatility
    if (volatility < 15) return 'text-yellow-600';    // Medium volatility
    if (volatility < 25) return 'text-orange-600';    // High volatility
    return 'text-red-600';                            // Extreme volatility
  };

  /**
   * Returns the appropriate icon for volatility level
   */
  const getVolatilityIcon = (volatility: number) => {
    if (volatility < 5) return <TrendingUp className="w-4 h-4" />;
    if (volatility < 15) return <AlertTriangle className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  /**
   * Gets tooltip text for risk level explanation
   */
  const getRiskTooltip = (volatility: number, riskLevel?: string): string => {
    const baseText = `${formatPercent(volatility)} volatility`;
    
    switch (riskLevel) {
      case 'Low':
        return `${baseText} - Stable prices, low risk`;
      case 'Medium':
        return `${baseText} - Moderate price fluctuations`;
      case 'High':
        return `${baseText} - High price volatility, higher risk`;
      case 'Extreme':
        return `${baseText} - Extreme volatility, very high risk`;
      default:
        return baseText;
    }
  };

  /**
   * Gets color class for ROI display based on percentage
   */
  const getROIColor = (roi: number): string => {
    if (roi >= 15) return 'bg-green-100 text-green-800';      // Excellent ROI
    if (roi >= 10) return 'bg-emerald-100 text-emerald-800';  // Good ROI
    if (roi >= 5) return 'bg-blue-100 text-blue-800';         // Decent ROI
    return 'bg-gray-100 text-gray-800';                       // Low ROI
  };

  // Loading state with skeleton placeholders
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state when no opportunities are found
  if (opportunities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Found</h3>
        <p className="text-gray-600">
          Try adjusting your budget or wait for the market data to update.
          Items with low volume or high volatility are filtered out for better recommendations.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Top Flip Opportunities</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {opportunities.length} profitable items (filtered by volume and stability)
              </p>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Info className="w-4 h-4 mr-1" />
              Click any row for detailed analysis
            </div>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('currentLow')}>
                  Prices {sortKey === 'currentLow' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('quantity')}>
                  Quantity {sortKey === 'quantity' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('volume')}>
                  24h Volume {sortKey === 'volume' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('totalCost')}>
                  Investment {sortKey === 'totalCost' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('profitAfterTax')}>
                  Net Profit {sortKey === 'profitAfterTax' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('roi')}>
                  ROI {sortKey === 'roi' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('volatility')}>
                  Risk {sortKey === 'volatility' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedOpportunities.map((opportunity, index) => (
                <tr 
                  key={opportunity.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedItemId(opportunity.id)}
                >
                  {/* Item Information Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* Item Icon */}
                      {opportunity.icon && (
                        <img
                          src={opportunity.icon}
                          alt={opportunity.name}
                          className="w-8 h-8 rounded mr-3"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        {/* Item Name */}
                        <div className="text-sm font-medium text-gray-900">
                          {opportunity.name}
                        </div>
                        {/* Ranking and Buy Limit */}
                        <div className="text-xs text-gray-500">
                          #{index + 1} • Limit: {formatBuyLimit(opportunity.buyLimit)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Price Information Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-gray-900" title={`${opportunity.currentLow.toLocaleString()} GP`}>
                      Buy: {formatCurrency(opportunity.currentLow)}
                    </div>
                    <div className="text-gray-600" title={`${opportunity.currentHigh.toLocaleString()} GP`}>
                      Sell: {formatCurrency(opportunity.currentHigh)}
                    </div>
                  </td>

                  {/* Recommended Quantity */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(opportunity.quantity)}
                  </td>

                  {/* 24h Volume Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-gray-900">
                      {opportunity.volume > 0 ? formatNumber(opportunity.volume) : '–'}
                    </div>
                    <div className="text-xs text-gray-500">
                      trades
                    </div>
                  </td>

                  {/* Total Investment Required */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" title={`${opportunity.totalCost.toLocaleString()} GP`}>
                    {formatCurrency(opportunity.totalCost)}
                  </td>

                  {/* Net Profit After Tax */}
                  <td className="px-6 py-4 whitespace-nowrap" title={`${opportunity.profitAfterTax.toLocaleString()} GP`}>
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(opportunity.profitAfterTax)}
                    </div>
                    <div className="text-xs text-gray-500">
                      After GE tax
                    </div>
                  </td>

                  {/* Return on Investment */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getROIColor(opportunity.roi)}`}>
                      {formatPercent(opportunity.roi)}
                    </span>
                  </td>

                  {/* Risk Assessment */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className={`flex items-center text-sm ${getVolatilityColor(opportunity.volatility)}`}
                      title={getRiskTooltip(opportunity.volatility, opportunity.riskLevel)}
                    >
                      {getVolatilityIcon(opportunity.volatility)}
                      <span className="ml-1">{formatPercent(opportunity.volatility)}</span>
                    </div>
                  </td>

                  {/* Details Button */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemId(opportunity.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="View detailed analysis"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Legend */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                <span>Low Risk (&lt;5%)</span>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="w-3 h-3 text-yellow-600 mr-1" />
                <span>Medium Risk (5-15%)</span>
              </div>
              <div className="flex items-center">
                <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                <span>High Risk (&gt;15%)</span>
              </div>
            </div>
            <div>
              ∞ = Unlimited buy limit • Click headers to sort
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItemId && (
        <ItemDetailModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </>
  );
}