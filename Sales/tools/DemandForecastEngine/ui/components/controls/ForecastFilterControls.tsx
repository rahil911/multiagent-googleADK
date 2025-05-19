import React from 'react';
import { ForecastHorizon, ForecastMetric } from '../../types';

interface ForecastFilterControlsProps {
  horizon: ForecastHorizon;
  onHorizonChange: (horizon: ForecastHorizon) => void;
  metric: ForecastMetric;
  onMetricChange: (metric: ForecastMetric) => void;
  onFilterClear: () => void;
}

const ForecastFilterControls: React.FC<ForecastFilterControlsProps> = ({
  horizon,
  onHorizonChange,
  metric,
  onMetricChange,
  onFilterClear,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Forecast Horizon Selector */}
      <div className="flex rounded-full bg-midnight-navy p-1">
        {(['week', 'month', 'quarter', 'year'] as ForecastHorizon[]).map((period) => (
          <button
            key={period}
            className={`px-3 py-1 rounded-full transition-colors ${
              horizon === period
                ? 'bg-electric-cyan text-midnight-navy'
                : 'text-cloud-white hover:bg-graphite'
            }`}
            onClick={() => onHorizonChange(period)}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Metric Selector */}
      <div className="flex rounded-full bg-midnight-navy p-1">
        {(['quantity', 'revenue'] as ForecastMetric[]).map((metricOption) => (
          <button
            key={metricOption}
            className={`px-3 py-1 rounded-full transition-colors ${
              metric === metricOption
                ? 'bg-electric-cyan text-midnight-navy'
                : 'text-cloud-white hover:bg-graphite'
            }`}
            onClick={() => onMetricChange(metricOption)}
          >
            {metricOption.charAt(0).toUpperCase() + metricOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Clear Filters Button */}
      <button
        className="px-3 py-1 rounded-md text-cloud-white hover:text-electric-cyan transition-colors"
        onClick={onFilterClear}
      >
        Clear Filters
      </button>
    </div>
  );
};

export default ForecastFilterControls;