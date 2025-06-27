import React, { useState, useCallback } from 'react';
import { TrendingUp, Database, Zap, RefreshCw } from 'lucide-react';
import { BudgetInput } from './components/BudgetInput';
import { AdvancedFilters } from './components/AdvancedFilters';
import { PortfolioSummary } from './components/PortfolioSummary';
import { OpportunityTable } from './components/OpportunityTable';
import { LoadingCard } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { useApi, apiRequest } from './hooks/useApi';
import { PortfolioSuggestion, FlipOpportunity } from './types/api';

/**
 * Main Application Component
 * 
 * This is the root component that orchestrates the entire OSRS Grand Exchange Tracker.
 * It manages the global state for budget selection, handles data fetching, and coordinates
 * the display of portfolio recommendations and trading opportunities.
 * 
 * Key responsibilities:
 * - Budget input and validation
 * - Portfolio data fetching and state management
 * - Manual data refresh functionality
 * - Error handling and loading states
 * - Layout and navigation structure
 */
function App() {
  // State for user's trading budget (default: 10M GP)
  const [budget, setBudget] = useState<number>(10000000);
  const [minVolume, setMinVolume] = useState<number>(1200);
  const [maxVolatility, setMaxVolatility] = useState<number>(30);
  const [showSpikes, setShowSpikes] = useState<boolean>(false);
  const [showHighRisk, setShowHighRisk] = useState<boolean>(false);
  const [betaMode, setBetaMode] = useState<boolean>(false);

  // When beta mode is toggled, enable or disable high-risk and spike filters
  React.useEffect(() => {
    if (betaMode) {
      setShowHighRisk(true);
      setShowSpikes(true);
    } else {
      setShowHighRisk(false);
      setShowSpikes(false);
    }
  }, [betaMode]);

  const [viewMode, setViewMode] = useState<'portfolio' | 'opportunities'>('portfolio');
  const [resultLimit, setResultLimit] = useState<number>(50);
  
  // State for manual refresh loading indicator
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Custom hook for fetching portfolio data based on budget
  // Automatically refetches when budget changes
  const portfolioUrl = `/api/portfolio?budget=${budget}&minVolume=${minVolume}&maxVolatility=${maxVolatility}&includeSpikes=${showSpikes}&includeHighRisk=${showHighRisk}`;
  const {
    data: portfolio,
    loading,
    error
  } = useApi<PortfolioSuggestion>(portfolioUrl, [budget, minVolume, maxVolatility, showSpikes, showHighRisk]);

  const opportunitiesUrl = `/api/opportunities?budget=${budget}&limit=${resultLimit}&minVolume=${minVolume}&maxVolatility=${maxVolatility}&includeSpikes=${showSpikes}&includeHighRisk=${showHighRisk}`;
  const {
    data: opportunities,
    loading: oppLoading,
    error: oppError
  } = useApi<FlipOpportunity[]>(opportunitiesUrl, [budget, minVolume, maxVolatility, resultLimit, showSpikes, showHighRisk]);

  /**
   * Handles manual data refresh by triggering API sync
   * Uses a clever technique to force re-fetch by temporarily changing budget
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Trigger server-side data synchronization
      await apiRequest('/api/sync', { method: 'POST' });
      
      // Force re-fetch by changing budget slightly and back
      // This triggers the useApi hook to refetch data
      setBudget(prev => prev + 1);
      setTimeout(() => setBudget(prev => prev - 1), 100);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const filteredPortfolio = portfolio
    ? {
        ...portfolio,
        opportunities: portfolio.opportunities.filter(
          (opp) =>
            opp.volume >= minVolume &&
            opp.volatility <= maxVolatility &&
            (showHighRisk || opp.volatility <= 25) &&
            (showSpikes || opp.isStable)
        ),
      }
    : null;

  const filteredOpportunities = opportunities
    ? opportunities.filter(
        (opp) =>
          opp.volume >= minVolume &&
          opp.volatility <= maxVolatility &&
          (showHighRisk || opp.volatility <= 25) &&
          (showSpikes || opp.isStable)
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Application Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo and Title Section */}
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  OSRS Grand Exchange Tracker
                </h1>
                <p className="text-sm text-gray-600">
                  Find profitable item flips with real-time market data
                </p>
              </div>
            </div>
            
            {/* Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300
                       rounded-md shadow-sm text-sm font-medium text-gray-700
                       bg-white hover:bg-gray-50 focus:outline-none focus:ring-2
                       focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>

            {/* Beta Mode Toggle */}
            <label className="flex items-center ml-4 text-sm text-gray-700" title="Show high-risk/long-term flips">
              <input
                type="checkbox"
                className="mr-2"
                checked={betaMode}
                onChange={(e) => setBetaMode(e.target.checked)}
              />
              Include High-Risk/Long-Term (Beta)
            </label>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Budget Input Component */}
          <BudgetInput
            budget={budget}
            onBudgetChange={setBudget}
            disabled={loading}
          />

          {betaMode && (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-md p-3">
              Beta mode: showing high-risk items. Results may be volatile.
            </div>
          )}

          {/* Advanced Filters */}
          <AdvancedFilters
            minVolume={minVolume}
            onMinVolumeChange={setMinVolume}
            maxVolatility={maxVolatility}
            onMaxVolatilityChange={setMaxVolatility}
            showSpikes={showSpikes}
            onShowSpikesChange={setShowSpikes}
            showHighRisk={showHighRisk}
            onShowHighRiskChange={setShowHighRisk}
            disabled={loading}
          />

          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="viewPortfolio"
                checked={viewMode === 'portfolio'}
                onChange={() => setViewMode('portfolio')}
              />
              <label htmlFor="viewPortfolio" className="text-sm text-gray-700">
                Optimized Portfolio
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="viewOpps"
                checked={viewMode === 'opportunities'}
                onChange={() => setViewMode('opportunities')}
              />
              <label htmlFor="viewOpps" className="text-sm text-gray-700">
                All Opportunities
              </label>
          </div>
          {viewMode === 'opportunities' && (
            <select
              value={resultLimit}
              onChange={(e) => setResultLimit(parseInt(e.target.value))}
              className="ml-4 border-gray-300 rounded-md text-sm"
            >
              {[25,50,100].map(l => (
                <option key={l} value={l}>{l} results</option>
              ))}
            </select>
          )}
          {import.meta.env.DEV && (
            <pre className="ml-4 text-xs text-gray-500 break-all">
              {viewMode === 'portfolio' ? portfolioUrl : opportunitiesUrl}
            </pre>
          )}
          </div>

          {/* Loading State Display */}
          {loading && (
            <LoadingCard 
              title="Analyzing Market Data" 
              description="Finding the best flip opportunities for your budget..."
            />
          )}

          {/* Error State Display */}
          {error && (
            <ErrorMessage 
              title="Failed to Load Data"
              message={error}
              onRetry={() => setBudget(prev => prev)}
            />
          )}

          {/* Data Display */}
          {viewMode === 'portfolio' && filteredPortfolio && !loading && !error && (
            <>
              <PortfolioSummary portfolio={filteredPortfolio} />
              <OpportunityTable opportunities={filteredPortfolio.opportunities} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {/* Real-time Data Info */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Database className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">Real-time Data</h3>
                  </div>
                  <p className="text-sm text-blue-800">
                    Prices update every 5 minutes from the RuneScape Wiki API
                  </p>
                </div>
                
                {/* GE Tax Info */}
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-900">GE Tax Included</h3>
                  </div>
                  <p className="text-sm text-green-800">
                    All profit calculations include the 2% Grand Exchange tax
                  </p>
                </div>
                
                {/* Smart Optimization Info */}
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Zap className="w-6 h-6 text-purple-600 mr-2" />
                    <h3 className="font-semibold text-purple-900">Smart Optimization</h3>
                  </div>
                  <p className="text-sm text-purple-800">
                    Considers buy limits, volatility, and budget allocation
                  </p>
                </div>
              </div>
            </>
          )}
          {viewMode === 'opportunities' && !oppLoading && !oppError && (
            <OpportunityTable opportunities={filteredOpportunities} />
          )}
          {viewMode === 'opportunities' && oppLoading && (
            <LoadingCard title="Loading Opportunities" description="Fetching data..." />
          )}
          {viewMode === 'opportunities' && oppError && (
            <ErrorMessage title="Failed to Load Data" message={oppError} onRetry={() => setBudget(prev => prev)} />
          )}
        </div>
      </main>

      {/* Application Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              Data provided by the RuneScape Wiki API
            </p>
            <p className="text-sm text-gray-500 mt-2 sm:mt-0">
              Built for Old School RuneScape players
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;