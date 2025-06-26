import React from 'react';

/**
 * Props interface for the LoadingSpinner component
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';  // Size variants for different use cases
  className?: string;         // Additional CSS classes
}

/**
 * Loading Spinner Component
 * 
 * A reusable animated spinner component for indicating loading states.
 * Features multiple size variants and customizable styling.
 * 
 * The spinner uses CSS animations and Tailwind classes for smooth rotation
 * and consistent visual feedback across the application.
 */
export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  /**
   * Size class mappings for different spinner variants
   * - sm: Small spinner for inline loading states
   * - md: Medium spinner for general use
   * - lg: Large spinner for full-page loading states
   */
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

/**
 * Props interface for the LoadingCard component
 */
interface LoadingCardProps {
  title: string;        // Main loading message
  description?: string; // Optional additional description
}

/**
 * Loading Card Component
 * 
 * A full-width loading state component that displays a spinner with
 * descriptive text. Used for major loading operations like data fetching.
 * 
 * This component provides consistent loading UX across the application
 * and helps users understand what operation is in progress.
 */
export function LoadingCard({ title, description }: LoadingCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      {/* Large Loading Spinner */}
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      
      {/* Loading Title */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      
      {/* Optional Description */}
      {description && (
        <p className="text-gray-600">{description}</p>
      )}
    </div>
  );
}