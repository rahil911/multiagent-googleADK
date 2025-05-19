import { 
  ForecastHorizon, 
  ForecastMetric, 
  DimensionFilter, 
  ModelType,
  ForecastData,
  ModelPerformance,
  ScenarioParams,
  SeasonalPattern
} from '../types';

// Mock API delay to simulate network latency
const mockApiDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// Base URL for API endpoints
const API_BASE_URL = '/api/forecast';

/**
 * Fetch forecast data based on provided parameters
 */
export const fetchForecastData = async (
  horizon: ForecastHorizon,
  metric: ForecastMetric,
  confidenceLevel: number,
  filters: DimensionFilter
): Promise<ForecastData[]> => {
  // In a real implementation, this would make an actual API call
  try {
    // Simulate API call
    await mockApiDelay();
    
    // Mock response data
    const today = new Date();
    const data: ForecastData[] = [];
    
    // Historical data (past 12 periods)
    for (let i = -12; i < 0; i++) {
      const date = new Date(today);
      
      // Adjust date based on forecast horizon
      if (horizon === 'week') {
        date.setDate(date.getDate() + (i * 7));
      } else if (horizon === 'month') {
        date.setMonth(date.getMonth() + i);
      } else if (horizon === 'quarter') {
        date.setMonth(date.getMonth() + (i * 3));
      } else if (horizon === 'year') {
        date.setFullYear(date.getFullYear() + i);
      }
      
      const baseValue = 1000 + Math.random() * 500;
      // Add seasonality
      const seasonality = Math.sin(date.getMonth() / 12 * Math.PI * 2) * 200;
      const actual = baseValue + seasonality + (i * 50); // Upward trend
      
      data.push({
        date: date.toISOString().split('T')[0],
        actual: metric === 'revenue' ? actual * 10 : actual,
        forecast: 0, // No forecast for historical data
        lowerBound: 0,
        upperBound: 0,
      });
    }
    
    // Forecast data (next 12 periods)
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      
      // Adjust date based on forecast horizon
      if (horizon === 'week') {
        date.setDate(date.getDate() + (i * 7));
      } else if (horizon === 'month') {
        date.setMonth(date.getMonth() + i);
      } else if (horizon === 'quarter') {
        date.setMonth(date.getMonth() + (i * 3));
      } else if (horizon === 'year') {
        date.setFullYear(date.getFullYear() + i);
      }
      
      const lastActual = data[data.length - 1].actual;
      const baseValue = lastActual + (i * 75); // Continue trend
      // Add seasonality
      const seasonality = Math.sin(date.getMonth() / 12 * Math.PI * 2) * 200;
      const forecast = baseValue + seasonality;
      // Confidence interval widens as we look further into the future
      const interval = (forecast * 0.05) * (1 + (i * 0.5)) * (1 - ((confidenceLevel - 50) / 50));
      
      data.push({
        date: date.toISOString().split('T')[0],
        actual: 0, // No actual for forecast data
        forecast: forecast,
        lowerBound: forecast - interval,
        upperBound: forecast + interval,
      });
    }
    
    return data;
    
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    throw error;
  }
};

/**
 * Fetch model performance metrics
 */
export const fetchModelPerformance = async (
  modelType: ModelType,
  horizon: ForecastHorizon,
  metric: ForecastMetric,
  filters: DimensionFilter
): Promise<ModelPerformance> => {
  // Simulate API call
  await mockApiDelay();
  
  // Generate metrics based on model type (better models have lower errors)
  let baseError;
  switch(modelType) {
    case 'movingAverage':
      baseError = 500 + Math.random() * 200;
      break;
    case 'exponentialSmoothing':
      baseError = 400 + Math.random() * 150;
      break;
    case 'arima':
      baseError = 300 + Math.random() * 100;
      break;
    case 'machineLearning':
      baseError = 200 + Math.random() * 80;
      break;
    default:
      baseError = 500;
  }
  
  const mae = baseError;
  const mse = baseError * baseError;
  const rmse = Math.sqrt(mse);
  const mape = (baseError / 5000) * 100; // As percentage
  
  return {
    mae,
    mse,
    rmse,
    mape,
  };
};

/**
 * Fetch seasonal pattern data
 */
export const fetchSeasonalPatterns = async (
  horizon: ForecastHorizon,
  metric: ForecastMetric,
  filters: DimensionFilter
): Promise<SeasonalPattern> => {
  // Simulate API call
  await mockApiDelay();
  
  // Mock seasonal pattern data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxIndex = 0.3 + Math.random() * 0.5; // 0.3 to 0.8
  const minIndex = -0.3 - Math.random() * 0.3; // -0.3 to -0.6
  
  const maxMonth = months[Math.floor(Math.random() * 12)];
  const minMonth = months[Math.floor(Math.random() * 12)];
  
  return {
    strength: 0.70 + Math.random() * 0.25, // 70-95%
    peakSeason: maxMonth,
    lowSeason: minMonth,
    amplitude: (1 + maxIndex) / (1 + minIndex), // Ratio between peak and low
  };
};

/**
 * Generate forecast scenario
 */
export const generateForecastScenario = async (
  baselineData: ForecastData[],
  scenarioParams: ScenarioParams,
  horizon: ForecastHorizon,
  metric: ForecastMetric
): Promise<ForecastData[]> => {
  // Simulate API call
  await mockApiDelay();
  
  // Apply scenario parameters to baseline data
  const scenarioData = baselineData.map(point => {
    // Only apply to forecast points (not historical)
    if (point.forecast === 0) {
      return { ...point };
    }
    
    // Apply growth assumption
    let newForecast = point.forecast * (1 + (scenarioParams.growthAssumption / 100));
    
    // Apply seasonality strength (later implementation would be more sophisticated)
    if (scenarioParams.seasonalityStrength !== 100) {
      // Extract seasonal component from baseline (simplified approach)
      const baselineTrend = point.forecast; // Simplified
      const seasonality = point.forecast - baselineTrend;
      
      // Scale seasonal component
      const scaledSeasonality = seasonality * (scenarioParams.seasonalityStrength / 100);
      newForecast = baselineTrend + scaledSeasonality;
    }
    
    // Apply price adjustment differently based on metric
    if (metric === 'revenue') {
      newForecast *= (1 + (scenarioParams.priceAdjustment / 100));
    } else { // quantity
      // Apply price elasticity (simplified: -0.3 elasticity)
      newForecast *= (1 - (scenarioParams.priceAdjustment / 100) * 0.3);
    }
    
    // Apply custom events
    // Not implemented in this mock for simplicity
    
    // Adjust confidence intervals
    const confidenceRange = point.upperBound - point.lowerBound;
    const centralValue = (point.upperBound + point.lowerBound) / 2;
    const percentChange = (newForecast - point.forecast) / point.forecast;
    
    return {
      ...point,
      forecast: newForecast,
      lowerBound: newForecast - (confidenceRange / 2) * (1 + Math.abs(percentChange/2)),
      upperBound: newForecast + (confidenceRange / 2) * (1 + Math.abs(percentChange/2)),
    };
  });
  
  return scenarioData;
};

/**
 * Full API service interface
 */
const demandForecastAPI = {
  fetchForecastData,
  fetchModelPerformance,
  fetchSeasonalPatterns,
  generateForecastScenario,
};

export default demandForecastAPI;