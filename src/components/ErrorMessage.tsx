import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Props interface for the ErrorMessage component
 */
interface ErrorMessageProps {
  title?: string;        // Error title (optional, has default)
  message: string;       // Error message to display
  onRetry?: () => void;  // Optional retry callback function
  retryLabel?: string;   // Custom retry button text
}

/**
 * Error Message Component
 * 
 * A comprehensive error display component that provides user-friendly error messages
 * with optional retry functionality. This component is used throughout the application
 * to handle various error states gracefully.
 * 
 * Features:
 * - Clear error messaging with appropriate iconography
 * - Optional retry button for recoverable errors
 * - Consistent styling that matches the application theme
 * - Accessible design with proper color contrast and focus states
 * 
 * The component helps maintain a positive user experience even when things go wrong
 * by providing clear information and actionable next steps.
 */
export function ErrorMessage({ 
  title = 'Something went wrong',  // Default error title
  message, 
  onRetry, 
  retryLabel = 'Try Again'        // Default retry button text
}: ErrorMessageProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      {/* Error Icon */}
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      
      {/* Error Title */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      
      {/* Error Message */}
      <p className="text-gray-600 mb-4">{message}</p>
      
      {/* Optional Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent 
                   text-sm font-medium rounded-md text-white bg-blue-600 
                   hover:bg-blue-700 focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}