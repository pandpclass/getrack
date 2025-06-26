import React from 'react';
import { Calculator, DollarSign } from 'lucide-react';

/**
 * Props interface for the BudgetInput component
 */
interface BudgetInputProps {
  budget: number;                    // Current budget value in GP
  onBudgetChange: (budget: number) => void;  // Callback when budget changes
  disabled?: boolean;                // Whether input should be disabled
}

/**
 * Budget Input Component
 * 
 * Provides an intuitive interface for users to input their trading budget.
 * Features include:
 * - Formatted number input with thousands separators
 * - Preset budget buttons for common amounts
 * - Input validation and sanitization
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
  const parseNumber = (str: string): number => {
    return parseInt(str.replace(/[^0-9]/g, '')) || 0;
  };

  /**
   * Handles input field changes with validation
   * Ensures the value doesn't exceed the maximum 32-bit integer
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumber(e.target.value);
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
        {/* Main Budget Input Field */}
        <div className="relative">
          {/* Currency Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          
          {/* Input Field */}
          <input
            type="text"
            value={formatNumber(budget)}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="Enter your budget in GP"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-lg font-medium"
          />
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