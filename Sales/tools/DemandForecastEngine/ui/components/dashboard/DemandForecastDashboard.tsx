import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setForecastHorizon, 
  setForecastMetric,
  setConfidenceLevel,
  setModelType,
  setDimensionFilters,
  clearFilters,
  fetchForecastData,
  fetchModelPerformance,
  fetchSeasonalPatterns,
  selectForecastParams
} from '../../state/demandForecastSlice';
import { ForecastHorizon, ForecastMetric, DimensionFilter, ModelType } from '../../types';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import Button from '../../../../../../ui-common/design-system/components/Button';

// Components
import ForecastHorizonExplorer from './ForecastHorizonExplorer';
import ModelPerformanceAnalyzer from './ModelPerformanceAnalyzer';
import SeasonalPatternDetector from './seasonalPatternDetector';
import ForecastScenarioBuilder from './ForecastScenarioBuilder';
import KpiTilesRow from './KpiTilesRow';
import ForecastInsightAssistant from '../conversational/ForecastInsightAssistant';

const DemandForecastDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  
  // Get forecast parameters from Redux
  const { horizon, metric, confidenceLevel, modelType, filters } = useSelector(selectForecastParams);
  
  // Local state for shared filters
  const [localFilters, setLocalFilters] = useState<DimensionFilter>(filters);
  
  // Fetch initial data
  useEffect(() => {
    dispatch(fetchForecastData());
    dispatch(fetchModelPerformance());
    dispatch(fetchSeasonalPatterns());
  }, [dispatch]);
  
  // Handle parameter changes
  const handleHorizonChange = (newHorizon: ForecastHorizon) => {
    dispatch(setForecastHorizon(newHorizon));
    dispatch(fetchForecastData());
    dispatch(fetchModelPerformance());
    dispatch(fetchSeasonalPatterns());
  };
  
  const handleMetricChange = (newMetric: ForecastMetric) => {
    dispatch(setForecastMetric(newMetric));
    dispatch(fetchForecastData());
    dispatch(fetchModelPerformance());
    dispatch(fetchSeasonalPatterns());
  };
  
  const handleConfidenceLevelChange = (newLevel: number) => {
    dispatch(setConfidenceLevel(newLevel));
    dispatch(fetchForecastData());
  };
  
  const handleModelTypeChange = (newModel: ModelType) => {
    dispatch(setModelType(newModel));
    dispatch(fetchModelPerformance());
  };
  
  const handleFilterChange = (newFilters: DimensionFilter) => {
    setLocalFilters({...localFilters, ...newFilters});
    dispatch(setDimensionFilters({...localFilters, ...newFilters}));
    dispatch(fetchForecastData());
    dispatch(fetchModelPerformance());
    dispatch(fetchSeasonalPatterns());
  };
  
  const handleClearFilters = () => {
    setLocalFilters({});
    dispatch(clearFilters());
    dispatch(fetchForecastData());
    dispatch(fetchModelPerformance());
    dispatch(fetchSeasonalPatterns());
  };
  
  // State for dashboard settings
  const [showInsightPanel, setShowInsightPanel] = useState<boolean>(false);

  return (
    <div style={{ 
      backgroundColor: theme.colors.midnightNavy, 
      padding: theme.spacing[5],
      minHeight: '100vh'
    }}>
      <div style={{ 
        maxWidth: '1600px', 
        margin: '0 auto'
      }}>
        {/* Dashboard Header */}
        <div style={{ 
          marginBottom: theme.spacing[5], 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <h1 style={{ 
            color: theme.colors.cloudWhite, 
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            margin: 0
          }}>
            Demand Forecast Engine
          </h1>
          <div style={{ 
            color: theme.colors.cloudWhite, 
            fontSize: theme.typography.fontSize.base,
            opacity: 0.7
          }}>
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
        
        {/* KPI Tiles Row */}
        <div style={{ marginBottom: theme.spacing[5] }}>
          <KpiTilesRow 
            forecastHorizon={horizon} 
            metric={metric} 
            filters={filters} 
          />
        </div>
        
        {/* Main content grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: theme.spacing[5],
          marginBottom: theme.spacing[5]
        }}>
          {/* Forecast Horizon Explorer - spans both columns */}
          <div style={{ gridColumn: 'span 2' }}>
            <ForecastHorizonExplorer 
              horizon={horizon}
              onHorizonChange={handleHorizonChange}
              metric={metric}
              onMetricChange={handleMetricChange}
              confidenceLevel={confidenceLevel}
              onConfidenceLevelChange={handleConfidenceLevelChange}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>
          
          {/* Model Performance Analyzer */}
          <div>
            <ModelPerformanceAnalyzer 
              modelType={modelType}
              onModelTypeChange={handleModelTypeChange}
              horizon={horizon}
              metric={metric}
              filters={filters}
            />
          </div>
          
          {/* Seasonal Pattern Detector */}
          <div>
            <SeasonalPatternDetector 
              horizon={horizon}
              metric={metric}
              filters={filters}
            />
          </div>
          
          {/* Forecast Scenario Builder - spans both columns */}
          <div style={{ gridColumn: 'span 2' }}>
            <ForecastScenarioBuilder 
              horizon={horizon}
              metric={metric}
              confidenceLevel={confidenceLevel}
              filters={filters}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ 
          borderTop: `1px solid rgba(58, 68, 89, 0.5)`,
          padding: `${theme.spacing[4]} 0`,
          color: theme.colors.cloudWhite,
          opacity: 0.5,
          fontSize: theme.typography.fontSize.sm,
          textAlign: 'center'
        }}>
          Demand Forecast Engine Dashboard v1.0 | Enterprise IQ Analytics Suite
        </div>
      </div>

      {/* Insight Assistant Toggle */}
      <Button 
        variant="primary"
        size="sm"
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTopLeftRadius: '8px',
          borderBottomLeftRadius: '8px',
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          padding: `${theme.spacing[2]} ${theme.spacing[3]}`
        }}
        onClick={() => setShowInsightPanel(!showInsightPanel)}
      >
        {showInsightPanel ? '>' : '<'} Insights
      </Button>
      
      {/* Insight Assistant Panel */}
      {showInsightPanel && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100%',
          width: '400px',
          backgroundColor: theme.colors.graphite,
          boxShadow: theme.shadows.lg,
          zIndex: 10,
          transition: 'all 300ms ease-in-out'
        }}>
          <ForecastInsightAssistant 
            horizon={horizon}
            metric={metric}
            filters={filters}
            onClose={() => setShowInsightPanel(false)}
          />
        </div>
      )}
    </div>
  );
};

export default DemandForecastDashboard;