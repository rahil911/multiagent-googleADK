import React, { useState, useEffect } from 'react';
import { ForecastHorizon, ForecastMetric, DimensionFilter } from '../../types';
import { formatCurrency, formatNumber, formatPercentage, getTrendColor, getTrendArrow } from '../../utils/chartHelpers';
import { KpiTile } from '../../../../../../ui-common';

interface KpiTilesRowProps {
  forecastHorizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
}

const KpiTilesRow: React.FC<KpiTilesRowProps> = ({
  forecastHorizon,
  metric,
  filters,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    totalForecast: 0,
    growth: 0,
    avgPerPeriod: 0,
    forecastAccuracy: 0,
    seasonalityStrength: 0,
  });

  // Simulate data loading
  useEffect(() => {
    setIsLoading(true);

    const fetchKpiData = () => {
      // In a real application, this would be an API call
      // Simulating data based on the parameters
      
      // Base values that change based on metric
      const baseValue = metric === 'revenue' ? 1250000 : 28500;
      
      // Growth varies by horizon (shorter horizons have more accurate/lower growth)
      let growthMultiplier;
      switch (forecastHorizon) {
        case 'week':
          growthMultiplier = 0.03;
          break;
        case 'month':
          growthMultiplier = 0.06;
          break;
        case 'quarter':
          growthMultiplier = 0.12;
          break;
        case 'year':
          growthMultiplier = 0.18;
          break;
        default:
          growthMultiplier = 0.06;
      }
      
      // Generate some variability based on selected filters
      const filterMultiplier = 1 + (Object.keys(filters).length * 0.05);
      
      const data = {
        totalForecast: baseValue * filterMultiplier,
        growth: (Math.random() * 0.05 + growthMultiplier) * filterMultiplier,
        avgPerPeriod: baseValue / 12 * filterMultiplier,
        forecastAccuracy: 0.92 - (Object.keys(filters).length * 0.02),
        seasonalityStrength: 0.65 + (Math.random() * 0.2),
      };
      
      setKpiData(data);
      setIsLoading(false);
    };

    // Simulate API delay
    setTimeout(fetchKpiData, 600);
  }, [forecastHorizon, metric, filters]);

  // Format and determine trend direction
  const getTotalForecastLabel = () => {
    switch (forecastHorizon) {
      case 'week':
        return 'Weekly Forecast';
      case 'month':
        return 'Monthly Forecast';
      case 'quarter':
        return 'Quarterly Forecast';
      case 'year':
        return 'Annual Forecast';
      default:
        return 'Total Forecast';
    }
  };

  const getFormattedValue = (value: number) => {
    return metric === 'revenue' ? formatCurrency(value) : formatNumber(value);
  };

  const getTrendDirection = (value: number) => {
    if (value > 0.05) return 'up-good';
    if (value > 0) return 'up-good';
    if (value < -0.05) return 'down-bad';
    if (value < 0) return 'down-bad';
    return 'neutral';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      {/* Total Forecast KPI */}
      <KpiTile
        value={getFormattedValue(kpiData.totalForecast)}
        label={getTotalForecastLabel()}
        trendValue={formatPercentage(kpiData.growth)}
        trendDirection={getTrendDirection(kpiData.growth)}
        isLoading={isLoading}
        subValue={`vs. previous ${forecastHorizon}`}
      />

      {/* Average Value KPI */}
      <KpiTile
        value={getFormattedValue(kpiData.avgPerPeriod)}
        label={`Avg. ${metric === 'revenue' ? 'Revenue' : 'Units'} per ${forecastHorizon}`}
        isLoading={isLoading}
      />

      {/* Forecast Accuracy KPI */}
      <KpiTile
        value={formatPercentage(kpiData.forecastAccuracy)}
        label="Forecast Accuracy"
        trendDirection={kpiData.forecastAccuracy > 0.9 ? 'up-good' : 'down-bad'}
        isLoading={isLoading}
      />

      {/* Seasonality Strength KPI */}
      <KpiTile
        value={formatPercentage(kpiData.seasonalityStrength)}
        label="Seasonality Impact"
        isLoading={isLoading}
        subValue="Detected pattern strength"
      />
    </div>
  );
};

export default KpiTilesRow;