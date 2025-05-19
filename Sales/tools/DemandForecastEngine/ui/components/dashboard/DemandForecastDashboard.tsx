import React, { useState } from 'react';
import ForecastHorizonExplorer from './ForecastHorizonExplorer';
import ModelPerformanceAnalyzer from './ModelPerformanceAnalyzer';
import SeasonalPatternDetector from './SeasonalPatternDetector';
import ForecastScenarioBuilder from './ForecastScenarioBuilder';
import KpiTilesRow from './KpiTilesRow';
import ForecastInsightAssistant from '../conversational/ForecastInsightAssistant';
import { DimensionFilter, ForecastHorizon, ForecastMetric, ModelType } from '../../types';

const DemandForecastDashboard: React.FC = () => {
  // State for dashboard settings
  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>('month');
  const [forecastMetric, setForecastMetric] = useState<ForecastMetric>('quantity');
  const [modelType, setModelType] = useState<ModelType>('movingAverage');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [showInsightPanel, setShowInsightPanel] = useState<boolean>(false);
  const [dimensionFilters, setDimensionFilters] = useState<DimensionFilter>({});

  // Handler for dimension filter changes
  const handleFilterChange = (newFilters: DimensionFilter) => {
    setDimensionFilters({...dimensionFilters, ...newFilters});
  };

  // Handler for clearing all filters
  const handleClearFilters = () => {
    setDimensionFilters({});
  };

  return (
    <div className="flex flex-col space-y-6 p-6 bg-midnight-navy min-h-screen">
      <h1 className="text-3xl font-semibold text-cloud-white">Demand Forecast Engine</h1>
      
      {/* KPI Tiles Row */}
      <KpiTilesRow forecastHorizon={forecastHorizon} metric={forecastMetric} filters={dimensionFilters} />
      
      {/* Main content section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Forecast Horizon Explorer */}
        <div className="bg-graphite rounded-2xl p-6 shadow-lg">
          <ForecastHorizonExplorer 
            horizon={forecastHorizon}
            onHorizonChange={setForecastHorizon}
            metric={forecastMetric}
            onMetricChange={setForecastMetric}
            confidenceLevel={confidenceLevel}
            onConfidenceLevelChange={setConfidenceLevel}
            filters={dimensionFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Model Performance Analyzer */}
        <div className="bg-graphite rounded-2xl p-6 shadow-lg">
          <ModelPerformanceAnalyzer 
            modelType={modelType}
            onModelTypeChange={setModelType}
            horizon={forecastHorizon}
            metric={forecastMetric}
            filters={dimensionFilters}
          />
        </div>

        {/* Seasonal Pattern Detector */}
        <div className="bg-graphite rounded-2xl p-6 shadow-lg">
          <SeasonalPatternDetector 
            horizon={forecastHorizon}
            metric={forecastMetric}
            filters={dimensionFilters}
          />
        </div>

        {/* Forecast Scenario Builder */}
        <div className="bg-graphite rounded-2xl p-6 shadow-lg">
          <ForecastScenarioBuilder 
            horizon={forecastHorizon}
            metric={forecastMetric}
            confidenceLevel={confidenceLevel}
            filters={dimensionFilters}
          />
        </div>
      </div>

      {/* Insight Assistant Toggle */}
      <button 
        className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-electric-cyan text-midnight-navy py-3 px-2 rounded-l-lg"
        onClick={() => setShowInsightPanel(!showInsightPanel)}
      >
        {showInsightPanel ? '>' : '<'} Insights
      </button>
      
      {/* Insight Assistant Panel */}
      {showInsightPanel && (
        <div className="fixed right-0 top-0 h-full w-96 bg-graphite shadow-lg z-10 transition-all duration-300 ease-in-out">
          <ForecastInsightAssistant 
            horizon={forecastHorizon}
            metric={forecastMetric}
            filters={dimensionFilters}
            onClose={() => setShowInsightPanel(false)}
          />
        </div>
      )}
    </div>
  );
};

export default DemandForecastDashboard;