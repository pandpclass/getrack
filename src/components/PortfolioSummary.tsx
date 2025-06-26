import React from 'react';
import { TrendingUp, DollarSign, Percent, Clock, Package, Target } from 'lucide-react';
import { PortfolioSuggestion } from '../types/api';
import { formatDistanceToNow } from 'date-fns';

/**
 * Props interface for the PortfolioSummary component
 */
interface PortfolioSummaryProps {
  portfolio: PortfolioSuggestion;  // Portfolio data to display
}

/**
 * Enhanced Portfolio Summary Component
 * 
 * Displays a comprehensive overview of the user's optimized trading portfolio.
 * Now includes additional metrics like item count, budget utilization, and
 * enhanced visual indicators for better user understanding.
 * 
 * New features:
 * - Item count and GE slot utilization
 * - Budget utilization percentage with visual indicator
 * - Enhanced color coding for different metrics
 * - Better responsive design for mobile devices
 */
export function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  /**
   * Formats large numbers into readable format with K/M suffixes
   * Examples: 1500 -> "1.5K", 2500000 -> "2.5M"
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
   * Example: 1500000 -> "1.5M GP"
   */
  const formatCurrency = (num: number): string => {
    return `${formatNumber(num)} GP`;
  };

  /**
   * Formats percentages with one decimal place
   * Example: 15.678 -> "15.7%"
   */
  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  /**
   * Gets color class for budget utilization indicator
   */
  const getBudgetUtilizationColor = (utilization: number): string => {
    if (utilization >= 90) return 'bg-green-500';      // Excellent utilization
    if (utilization >= 70) return 'bg-blue-500';       // Good utilization
    if (utilization >= 50) return 'bg-yellow-500';     // Moderate utilization
    return 'bg-gray-400';                              // Low utilization
  };

  /**
   * Gets color class for ROI display
   */
  const getROIColor = (roi: number): string => {
    if (roi >= 15) return 'text-green-900 bg-green-50';      // Excellent ROI
    if (roi >= 10) return 'text-emerald-900 bg-emerald-50';  // Good ROI
    if (roi >= 5) return 'text-blue-900 bg-blue-50';         // Decent ROI
    return 'text-gray-900 bg-gray-50';                       // Low ROI
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Portfolio Summary</h2>
          <p className="text-sm text-gray-600 mt-1">
            Optimized selection of {portfolio.itemCount} items (max 8 GE slots)
          </p>
        </div>
        
        {/* Last Updated Timestamp */}
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-1" />
          Updated {formatDistanceToNow(new Date(portfolio.updatedAt), { addSuffix: true })}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Investment Cost */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Cost</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(portfolio.totalCost)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Gross Profit (Before Tax) */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Gross Profit</p>
              <p className="text-xl font-bold text-green-900">
                {formatCurrency(portfolio.totalProfit)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Net Profit (After GE Tax with 5M cap) */}
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Net Profit</p>
              <p className="text-xl font-bold text-emerald-900">
                {formatCurrency(portfolio.totalProfitAfterTax)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                After GE tax (5M cap)
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        {/* Return on Investment */}
        <div className={`rounded-lg p-4 ${getROIColor(portfolio.totalROI)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">Total ROI</p>
              <p className="text-xl font-bold">
                {formatPercent(portfolio.totalROI)}
              </p>
            </div>
            <Percent className="w-8 h-8 opacity-60" />
          </div>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        {/* Number of Items Selected */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Package className="w-4 h-4 text-gray-600 mr-1" />
            <div className="font-medium text-gray-900">{portfolio.itemCount}/8</div>
          </div>
          <div className="text-gray-600">GE Slots Used</div>
        </div>
        
        {/* Unused Budget Amount */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-900">
            {formatCurrency(portfolio.totalBudget - portfolio.totalCost)}
          </div>
          <div className="text-gray-600">Unused Budget</div>
        </div>
        
        {/* Budget Utilization with Visual Indicator */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-gray-600 mr-1" />
            <div className="font-medium text-gray-900">
              {formatPercent(portfolio.budgetUtilization)}
            </div>
          </div>
          <div className="text-gray-600 mb-2">Budget Utilized</div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getBudgetUtilizationColor(portfolio.budgetUtilization)}`}
              style={{ width: `${Math.min(portfolio.budgetUtilization, 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Average ROI per Item */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-900">
            {portfolio.itemCount > 0 ? formatPercent(portfolio.totalROI / portfolio.itemCount) : '0%'}
          </div>
          <div className="text-gray-600">Avg ROI per Item</div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Portfolio Optimization</h4>
            <div className="mt-1 text-sm text-blue-800">
              <ul className="space-y-1">
                <li>• Items filtered by volume (min 1,200 trades/24h) and stability</li>
                <li>• Unlimited buy limits (∞) allow larger investments in profitable items</li>
                <li>• GE tax calculations include 5M cap for high-value items</li>
                <li>• Composite scoring balances profit, volume, and ROI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}