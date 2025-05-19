import { ForecastData, ModelPerformance, SeasonalPattern, DimensionFilter, ForecastHorizon, ForecastMetric, ModelType } from '../types';

/**
 * Fetch forecast data from the API
 */
export const fetchForecastData = async (
  horizon: ForecastHorizon, 
  metric: ForecastMetric, 
  filters: DimensionFilter,
  confidenceLevel: number
): Promise<ForecastData[]> => {
  const queryParams = new URLSearchParams({
    horizon,
    metric,
    confidence: confidenceLevel.toString(),
    ...filters
  } as any);
  
  const response = await fetch(`/api/sales/demand-forecast/data?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch forecast data');
  }
  
  return await response.json();
};

/**
 * Fetch model performance data from the API
 */
export const fetchModelPerformance = async (
  modelType: ModelType,
  horizon: ForecastHorizon,
  metric: ForecastMetric,
  filters: DimensionFilter
): Promise<ModelPerformance> => {
  const queryParams = new URLSearchParams({
    model: modelType,
    horizon,
    metric,
    ...filters
  } as any);
  
  const response = await fetch(`/api/sales/demand-forecast/model-performance?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch model performance data');
  }
  
  return await response.json();
};

/**
 * Fetch seasonal pattern data from the API
 */
export const fetchSeasonalPatterns = async (
  horizon: ForecastHorizon,
  metric: ForecastMetric,
  filters: DimensionFilter
): Promise<SeasonalPattern> => {
  const queryParams = new URLSearchParams({
    horizon,
    metric,
    ...filters
  } as any);
  
  const response = await fetch(`/api/sales/demand-forecast/seasonal-patterns?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch seasonal patterns');
  }
  
  return await response.json();
};
