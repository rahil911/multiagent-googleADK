// This is a Next.js API route that proxies to the actual implementation
// in the Demand Forecast Engine tool directory

import { fetchForecastData, fetchModelPerformance, fetchSeasonalPatterns, generateForecastScenario } from '../../../../Sales/tools/DemandForecastEngine/ui/api/demandForecastApi';

export default async function handler(req, res) {
  try {
    const { 
      horizon = 'month', 
      metric = 'quantity', 
      confidenceLevel = 95, 
      modelType = 'movingAverage',
      filters = {},
      scenarioParams = null
    } = req.body || req.query;

    // Choose which API function to call based on endpoint parameter
    const endpoint = req.query.endpoint || 'forecast';
    
    let data;
    switch (endpoint) {
      case 'forecast':
        data = await fetchForecastData(horizon, metric, confidenceLevel, filters);
        break;
      case 'performance':
        data = await fetchModelPerformance(modelType, horizon, metric, filters);
        break;
      case 'seasonal':
        data = await fetchSeasonalPatterns(horizon, metric, filters);
        break;
      case 'scenario':
        // For scenario generation, we need baseline data and scenario parameters
        if (!scenarioParams) {
          return res.status(400).json({ error: 'Missing scenario parameters' });
        }
        const baselineData = await fetchForecastData(horizon, metric, confidenceLevel, filters);
        data = await generateForecastScenario(baselineData, scenarioParams, horizon, metric);
        break;
      default:
        return res.status(400).json({ error: 'Invalid endpoint specified' });
    }
    
    // Return the data as JSON
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in demand forecast API route:', error);
    res.status(500).json({ error: 'Failed to fetch demand forecast data' });
  }
} 