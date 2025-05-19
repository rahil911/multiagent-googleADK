// utils/chartHelpers.ts
import { ForecastData } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const calculateGrowth = (current: number, previous: number): number => {
  return previous !== 0 ? (current - previous) / previous : 0;
};

// Add more helper functions as needed