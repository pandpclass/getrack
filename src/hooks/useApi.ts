import { useState, useEffect } from 'react';
import axios from 'axios';
import { ApiResponse } from '../types/api';

/**
 * Base URL for API requests
 * Configurable via the VITE_API_BASE_URL environment variable
*/
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Custom React Hook for API Data Fetching
 * 
 * This hook provides a clean interface for fetching data from the API with
 * built-in loading states, error handling, and dependency-based refetching.
 * 
 * Features:
 * - Automatic loading state management
 * - Error handling with user-friendly messages
 * - Dependency-based refetching (similar to useEffect)
 * - Request cancellation to prevent memory leaks
 * - TypeScript generics for type-safe responses
 * 
 * @param url - API endpoint to fetch from
 * @param dependencies - Array of values that trigger refetch when changed
 * @returns Object containing data, loading state, and error message
 */
export function useApi<T>(url: string, dependencies: unknown[] = []) {
  // State for storing the fetched data
  const [data, setData] = useState<T | null>(null);
  
  // Loading state indicator
  const [loading, setLoading] = useState(true);
  
  // Error message storage
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Flag to prevent state updates if component unmounts
    let cancelled = false;

    /**
     * Async function to fetch data from the API
     * Handles the complete request lifecycle including error states
     */
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Make the API request with proper typing
        const response = await axios.get<ApiResponse<T>>(`${API_BASE_URL}${url}`);
        
        // Check if component was unmounted during request
        if (cancelled) return;
        
        // Handle successful response
        if (response.data.success) {
          setData(response.data.data || null);
        } else {
          // Handle API-level errors (success: false)
          setError(response.data.error || 'Unknown error occurred');
        }
      } catch (err) {
        // Prevent state updates if component unmounted
        if (cancelled) return;
        
        // Handle different types of errors
        if (axios.isAxiosError(err)) {
          // Network or HTTP errors
          setError(err.response?.data?.error || err.message);
        } else {
          // Unexpected errors
          setError('An unexpected error occurred');
        }
      } finally {
        // Always clear loading state (unless cancelled)
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Execute the fetch operation
    fetchData();

    // Cleanup function to prevent memory leaks
    return () => {
      cancelled = true;
    };
  }, [url, ...dependencies]); // Re-run when dependencies change

  return { data, loading, error };
}

/**
 * Generic API Request Function
 * 
 * A utility function for making one-off API requests outside of React components.
 * Useful for actions like manual data refresh, form submissions, etc.
 * 
 * @param url - API endpoint to request
 * @param options - Axios request options (method, data, headers, etc.)
 * @returns Promise resolving to the response data
 * @throws Error if the request fails or API returns an error
 */
export async function apiRequest<T>(
  url: string,
  options?: Record<string, unknown>
): Promise<T> {
  const response = await axios.request<ApiResponse<T>>({
    url: `${API_BASE_URL}${url}`,
    ...options,
  });

  // Check if the API request was successful
  if (response.data.success) {
    return response.data.data!;
  } else {
    // Throw an error for failed API responses
    throw new Error(response.data.error || 'API request failed');
  }
}