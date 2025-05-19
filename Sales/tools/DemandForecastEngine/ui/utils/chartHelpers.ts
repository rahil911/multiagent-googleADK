// utils/chartHelpers.ts
import { ForecastData } from '../types';

/**
 * Format a number with proper separators
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};

/**
 * Format a currency value
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format a percentage value
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
};

/**
 * Format a date for display in charts
 */
export const formatDate = (dateString: string, horizon: 'week' | 'month' | 'quarter' | 'year'): string => {
  const date = new Date(dateString);
  
  switch (horizon) {
    case 'week':
      // Format like "Jan 15"
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'month':
      // Format like "Jan 2023"
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    case 'quarter':
      // Format like "Q1 2023"
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    case 'year':
      // Format like "2023"
      return date.getFullYear().toString();
    default:
      return dateString;
  }
};

/**
 * Get a color for the confidence interval based on the theme
 */
export const getConfidenceIntervalColor = (confidenceLevel: number): string => {
  // Electric cyan with varying opacity based on confidence level
  return `rgba(0, 224, 255, ${0.3 + (confidenceLevel - 50) / 100})`;
};

/**
 * Get a color based on error magnitude
 */
export const getErrorColor = (errorMagnitude: 'low' | 'medium' | 'high'): string => {
  switch (errorMagnitude) {
    case 'low':
      return '#00e0ff'; // Electric Cyan
    case 'medium':
      return '#5fd4d6'; // Lighter cyan
    case 'high':
      return '#e930ff'; // Signal Magenta
    default:
      return '#00e0ff';
  }
};

/**
 * Get a trend color based on direction and context
 */
export const getTrendColor = (trendDirection: 'up-good' | 'up-bad' | 'down-good' | 'down-bad' | 'neutral'): string => {
  switch (trendDirection) {
    case 'up-good':
    case 'down-good':
      return '#00C853'; // Success green
    case 'up-bad':
    case 'down-bad':
      return '#FF5252'; // Error red
    default:
      return '#f7f9fb'; // Cloud white
  }
};

/**
 * Get a trend arrow symbol based on direction
 */
export const getTrendArrow = (trendDirection: string): string => {
  if (trendDirection.startsWith('up')) {
    return '↑';
  } else if (trendDirection.startsWith('down')) {
    return '↓';
  } else {
    return '→';
  }
};

/**
 * Create a legend formatter function
 */
export const createLegendFormatter = (prefix: string = ''): (value: string) => string => {
  return (value: string) => {
    // Capitalize first letter and add prefix if provided
    const formatted = value.charAt(0).toUpperCase() + value.slice(1);
    return prefix ? `${prefix} ${formatted}` : formatted;
  };
};

// Add more helper functions as needed