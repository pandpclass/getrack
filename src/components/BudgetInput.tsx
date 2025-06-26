import React from 'react';
import { Calculator } from 'lucide-react';

/**
 * Props interface for the BudgetInput component
 */
interface BudgetInputProps {
  budget: number; // Current budget value in GP
  onBudgetChange: (budget: number) => void; // Callback when budget changes
  disabled?: boolean; // Whether input should be disabled
}

/**
 * Budget Input Component
 * 
 * Provides an intuitive interface for users to input their trading budget.
 * Features include:
 * - Slider input with formatted budget display
 * - Preset budget buttons for common amounts
 * - Responsive design for all screen sizes
 * 
 * The component handles number formatting to make large GP amounts readable
 * and provides quick-select buttons for common trading budgets.
 */
export function BudgetInput({ budget, onBudgetChange, disabled }: BudgetInputProps) {
  /**
   * Formats a number with thousands separators for display
   * Example: 1000000 -> "1,000,000"
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  /**
   * Parses a formatted string back to a number
   * Removes all non-numeric characters and converts to integer
   * Example: "1,000,000" -> 1000000
   */
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onBudgetChange(Math.min(value, 2147483647)); // Max int32 limit
  };

  /**
   * Predefined budget amounts for quick selection
   * Covers common trading budget ranges from beginners to high-level players
   */
  const presetBudgets = [
    { label: '100K', value: 100000 },      // Beginner budget
    { label: '1M', value: 1000000 },       // Low-level trading
    { label: '10M', value: 10000000 },     // Mid-level trading
    { label: '100M', value: 100000000 },   // High-level trading
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Component Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Trading Budget</h2>
      </div>
      
      <div className="space-y-4">
        {/* Slider Input */}
        <div>
          <input
            type="range"
            min={100000}
            max={2147483647}
            step={100000}
            value={budget}
            onChange={handleSliderChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-blue-500"
          />
        </div>

        <div className="text-center text-lg font-medium text-gray-800">
          {formatNumber(budget)} GP
        </div>
        
        {/* Preset Budget Buttons */}
        <div className="flex flex-wrap gap-2">
          {presetBudgets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onBudgetChange(preset.value)}
              disabled={disabled}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                       rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 
                       focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
        
        {/* Budget Display */}
        {budget > 0 && (
          <div className="text-sm text-gray-600">
            Budget: <span className="font-medium text-gray-800">{formatNumber(budget)} GP</span>
          </div>
        )}
      </div>
    </div>
  );
}