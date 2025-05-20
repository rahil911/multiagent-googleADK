import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
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
import demandForecastAPI from '../api/demandForecastApi';

// State interface
interface DemandForecastState {
  // Parameters
  forecastHorizon: ForecastHorizon;
  forecastMetric: ForecastMetric;
  confidenceLevel: number;
  modelType: ModelType;
  dimensionFilters: DimensionFilter;
  
  // Data
  forecastData: ForecastData[];
  forecastLoading: boolean;
  forecastError: string | null;
  
  // Model performance
  modelPerformance: ModelPerformance | null;
  modelPerformanceLoading: boolean;
  modelPerformanceError: string | null;
  
  // Seasonality
  seasonalPattern: SeasonalPattern | null;
  seasonalPatternLoading: boolean;
  seasonalPatternError: string | null;
  
  // Scenarios
  scenarios: ScenarioParams[];
  activeScenarioId: string | null;
  scenarioLoading: boolean;
  scenarioError: string | null;
  
  // New fields from the code block
  scenarioParams: ScenarioParams | null;
  scenarioData: ForecastData[] | null;
  isLoading: boolean;
  showInsightPanel: boolean;
}

// Initial state
const initialState: DemandForecastState = {
  // Parameters
  forecastHorizon: 'month',
  forecastMetric: 'quantity',
  confidenceLevel: 95,
  modelType: 'movingAverage',
  dimensionFilters: {},
  
  // Data
  forecastData: [],
  forecastLoading: false,
  forecastError: null,
  
  // Model performance
  modelPerformance: null,
  modelPerformanceLoading: false,
  modelPerformanceError: null,
  
  // Seasonality
  seasonalPattern: null,
  seasonalPatternLoading: false,
  seasonalPatternError: null,
  
  // Scenarios
  scenarios: [
    {
      name: 'Baseline',
      color: '#00e0ff', // Electric Cyan
      growthAssumption: 0,
      seasonalityStrength: 100,
      priceAdjustment: 0,
      customEvents: [],
    }
  ],
  activeScenarioId: null,
  scenarioLoading: false,
  scenarioError: null,
  
  // New fields from the code block
  scenarioParams: null,
  scenarioData: null,
  isLoading: false,
  showInsightPanel: false
};

// Async thunks
export const fetchForecastData = createAsyncThunk(
  'demandForecast/fetchForecastData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { demandForecast: DemandForecastState };
      const { forecastHorizon, forecastMetric, confidenceLevel, dimensionFilters } = state.demandForecast;
      
      const data = await demandForecastAPI.fetchForecastData(
        forecastHorizon,
        forecastMetric,
        confidenceLevel,
        dimensionFilters
      );
      
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch forecast data');
    }
  }
);

export const fetchModelPerformance = createAsyncThunk(
  'demandForecast/fetchModelPerformance',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { demandForecast: DemandForecastState };
      const { modelType, forecastHorizon, forecastMetric, dimensionFilters } = state.demandForecast;
      
      const performance = await demandForecastAPI.fetchModelPerformance(
        modelType,
        forecastHorizon,
        forecastMetric,
        dimensionFilters
      );
      
      return performance;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch model performance');
    }
  }
);

export const fetchSeasonalPatterns = createAsyncThunk(
  'demandForecast/fetchSeasonalPatterns',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { demandForecast: DemandForecastState };
      const { forecastHorizon, forecastMetric, dimensionFilters } = state.demandForecast;
      
      const patterns = await demandForecastAPI.fetchSeasonalPatterns(
        forecastHorizon,
        forecastMetric,
        dimensionFilters
      );
      
      return patterns;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch seasonal patterns');
    }
  }
);

export const generateScenario = createAsyncThunk(
  'demandForecast/generateScenario',
  async (scenarioParams: ScenarioParams, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { demandForecast: DemandForecastState };
      const { forecastData, forecastHorizon, forecastMetric } = state.demandForecast;
      
      const scenarioData = await demandForecastAPI.generateForecastScenario(
        forecastData,
        scenarioParams,
        forecastHorizon,
        forecastMetric
      );
      
      return { scenarioParams, scenarioData };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate scenario');
    }
  }
);

// Create the slice
const demandForecastSlice = createSlice({
  name: 'demandForecast',
  initialState,
  reducers: {
    setForecastHorizon(state, action: PayloadAction<ForecastHorizon>) {
      state.forecastHorizon = action.payload;
    },
    setForecastMetric(state, action: PayloadAction<ForecastMetric>) {
      state.forecastMetric = action.payload;
    },
    setConfidenceLevel(state, action: PayloadAction<number>) {
      state.confidenceLevel = action.payload;
    },
    setModelType(state, action: PayloadAction<ModelType>) {
      state.modelType = action.payload;
    },
    setDimensionFilters(state, action: PayloadAction<DimensionFilter>) {
      state.dimensionFilters = action.payload;
    },
    clearFilters(state) {
      state.dimensionFilters = {};
    },
    addScenario(state, action: PayloadAction<ScenarioParams>) {
      state.scenarios.push(action.payload);
    },
    removeScenario(state, action: PayloadAction<string>) {
      state.scenarios = state.scenarios.filter(scenario => scenario.name !== action.payload);
      if (state.activeScenarioId === action.payload) {
        state.activeScenarioId = null;
      }
    },
    setActiveScenario(state, action: PayloadAction<string | null>) {
      state.activeScenarioId = action.payload;
    },
    setForecastData(state, action: PayloadAction<ForecastData[]>) {
      state.forecastData = action.payload;
    },
    setModelPerformance(state, action: PayloadAction<ModelPerformance>) {
      state.modelPerformance = action.payload;
    },
    setSeasonalPatterns(state, action: PayloadAction<SeasonalPattern>) {
      state.seasonalPattern = action.payload;
    },
    setScenarioParams(state, action: PayloadAction<ScenarioParams | null>) {
      state.scenarioParams = action.payload;
    },
    setScenarioData(state, action: PayloadAction<ForecastData[] | null>) {
      state.scenarioData = action.payload;
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.forecastError = action.payload;
      state.modelPerformanceError = action.payload;
      state.seasonalPatternError = action.payload;
      state.scenarioError = action.payload;
    },
    toggleInsightPanel(state) {
      state.showInsightPanel = !state.showInsightPanel;
    }
  },
  extraReducers: (builder) => {
    builder
      // Forecast data
      .addCase(fetchForecastData.pending, (state) => {
        state.forecastLoading = true;
        state.forecastError = null;
      })
      .addCase(fetchForecastData.fulfilled, (state, action) => {
        state.forecastLoading = false;
        state.forecastData = action.payload;
      })
      .addCase(fetchForecastData.rejected, (state, action) => {
        state.forecastLoading = false;
        state.forecastError = action.payload as string;
      })
      
      // Model performance
      .addCase(fetchModelPerformance.pending, (state) => {
        state.modelPerformanceLoading = true;
        state.modelPerformanceError = null;
      })
      .addCase(fetchModelPerformance.fulfilled, (state, action) => {
        state.modelPerformanceLoading = false;
        state.modelPerformance = action.payload;
      })
      .addCase(fetchModelPerformance.rejected, (state, action) => {
        state.modelPerformanceLoading = false;
        state.modelPerformanceError = action.payload as string;
      })
      
      // Seasonal patterns
      .addCase(fetchSeasonalPatterns.pending, (state) => {
        state.seasonalPatternLoading = true;
        state.seasonalPatternError = null;
      })
      .addCase(fetchSeasonalPatterns.fulfilled, (state, action) => {
        state.seasonalPatternLoading = false;
        state.seasonalPattern = action.payload;
      })
      .addCase(fetchSeasonalPatterns.rejected, (state, action) => {
        state.seasonalPatternLoading = false;
        state.seasonalPatternError = action.payload as string;
      })
      
      // Scenario generation
      .addCase(generateScenario.pending, (state) => {
        state.scenarioLoading = true;
        state.scenarioError = null;
      })
      .addCase(generateScenario.fulfilled, (state, action) => {
        state.scenarioLoading = false;
        
        // Add the scenario if it doesn't exist yet
        const existingIndex = state.scenarios.findIndex(
          scenario => scenario.name === action.payload.scenarioParams.name
        );
        
        if (existingIndex === -1) {
          state.scenarios.push(action.payload.scenarioParams);
        } else {
          state.scenarios[existingIndex] = action.payload.scenarioParams;
        }
        
        state.activeScenarioId = action.payload.scenarioParams.name;
      })
      .addCase(generateScenario.rejected, (state, action) => {
        state.scenarioLoading = false;
        state.scenarioError = action.payload as string;
      });
  },
});

// Export actions
export const { 
  setForecastHorizon,
  setForecastMetric,
  setConfidenceLevel,
  setModelType,
  setDimensionFilters,
  clearFilters,
  addScenario,
  removeScenario,
  setActiveScenario,
  setForecastData,
  setModelPerformance,
  setSeasonalPatterns,
  setScenarioParams,
  setScenarioData,
  setIsLoading,
  setError,
  toggleInsightPanel
} = demandForecastSlice.actions;

// Base selectors (simple state access)
const getState = (state: any) => state && state.demandForecast ? state.demandForecast : null;

// Use createSelector for improved performance and reliability
export const selectForecastParams = createSelector(
  [getState],
  (demandForecast) => {
    if (!demandForecast) {
      // Return defaults if state is not available
      return {
        horizon: 'month' as ForecastHorizon,
        metric: 'quantity' as ForecastMetric,
        confidenceLevel: 95,
        modelType: 'movingAverage' as ModelType,
        filters: {},
      };
    }
    
    return {
      horizon: demandForecast.forecastHorizon,
      metric: demandForecast.forecastMetric,
      confidenceLevel: demandForecast.confidenceLevel,
      modelType: demandForecast.modelType,
      filters: demandForecast.dimensionFilters,
    };
  }
);

export const selectForecastData = createSelector(
  [getState],
  (demandForecast) => {
    if (!demandForecast) {
      return {
        data: [],
        loading: false,
        error: null,
      };
    }
    
    return {
      data: demandForecast.forecastData,
      loading: demandForecast.forecastLoading,
      error: demandForecast.forecastError,
    };
  }
);

export const selectModelPerformance = createSelector(
  [getState],
  (demandForecast) => {
    if (!demandForecast) {
      return {
        performance: null,
        loading: false,
        error: null,
      };
    }
    
    return {
      performance: demandForecast.modelPerformance,
      loading: demandForecast.modelPerformanceLoading,
      error: demandForecast.modelPerformanceError,
    };
  }
);

export const selectSeasonalPattern = createSelector(
  [getState],
  (demandForecast) => {
    if (!demandForecast) {
      return {
        pattern: null,
        loading: false,
        error: null,
      };
    }
    
    return {
      pattern: demandForecast.seasonalPattern,
      loading: demandForecast.seasonalPatternLoading,
      error: demandForecast.seasonalPatternError,
    };
  }
);

export const selectScenarios = createSelector(
  [getState],
  (demandForecast) => {
    if (!demandForecast) {
      return {
        scenarios: [],
        activeScenarioId: null,
        loading: false,
        error: null,
      };
    }
    
    return {
      scenarios: demandForecast.scenarios,
      activeScenarioId: demandForecast.activeScenarioId,
      loading: demandForecast.scenarioLoading,
      error: demandForecast.scenarioError,
    };
  }
);

// Export reducer
export default demandForecastSlice.reducer;