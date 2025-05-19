// types/index.ts
export interface ForecastData {
  date: string;
  actual: number;
  forecast: number;
  lowerBound: number;
  upperBound: number;
}

export interface ModelPerformance {
  mae: number;
  mse: number;
  rmse: number;
  mape: number;
}

export type ForecastHorizon = 'week' | 'month' | 'quarter' | 'year';
export type ForecastMetric = 'quantity' | 'revenue';
export type ModelType = 'movingAverage' | 'exponentialSmoothing' | 'arima' | 'machineLearning';

export interface DimensionFilter {
  product?: string;
  region?: string;
  category?: string;
  channel?: string;
}

export interface ScenarioParams {
  name: string;
  color: string;
  growthAssumption: number;
  seasonalityStrength: number;
  priceAdjustment: number;
  customEvents: Array<{date: string, name: string, impact: number}>;
}

export interface SeasonalPattern {
  strength: number;
  peakSeason: string;
  lowSeason: string;
  amplitude: number;
}

// Add more types as needed