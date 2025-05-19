import React, { useState, useEffect } from 'react';
import { ForecastHorizon, ForecastMetric, DimensionFilter } from '../../types';
import { formatCurrency, formatNumber, formatPercentage, getTrendColor, getTrendArrow } from '../../utils/chartHelpers';
import { useTheme } from '../../../../../../ui-common/design-system/theme';

interface KpiTilesRowProps {
  forecastHorizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
}

/**
 * KPI Tiles Row Component
 * Displays the 5 forecast KPI tiles as specified in the UI specifications
 */
const KpiTilesRow: React.FC<KpiTilesRowProps> = ({
  forecastHorizon,
  metric,
  filters,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    totalForecast: 0,
    growth: 0,
    avgPerPeriod: 0,
    forecastAccuracy: 0,
    seasonalImpact: 0,
    demandTrend: '' as 'Increasing' | 'Stable' | 'Decreasing' | 'Volatile'
  });

  useEffect(() => {
    setIsLoading(true);
    
    // In a real implementation, this would be a fetch call to the API
    setTimeout(() => {
      // Generate mock KPI data
      const totalForecast = metric === 'revenue' 
        ? 1200000 + Math.random() * 500000 
        : 12000 + Math.random() * 5000;
        
      const growth = (Math.random() * 20) - 5; // -5% to 15%
      
      const avgPerPeriod = totalForecast / (
        forecastHorizon === 'week' ? 12 :
        forecastHorizon === 'month' ? 6 :
        forecastHorizon === 'quarter' ? 4 : 3
      );
      
      const forecastAccuracy = 85 + Math.random() * 10; // 85-95%
      const seasonalImpact = 15 + Math.random() * 20; // 15-35%
      
      // Random demand trend
      const trendOptions = ['Increasing', 'Stable', 'Decreasing', 'Volatile'] as const;
      const demandTrend = trendOptions[Math.floor(Math.random() * trendOptions.length)];
      
      setKpiData({
        totalForecast,
        growth,
        avgPerPeriod,
        forecastAccuracy,
        seasonalImpact,
        demandTrend
      });
      
      setIsLoading(false);
    }, 500);
  }, [forecastHorizon, metric, filters]);

  const formatValue = (value: number) => {
    return metric === 'revenue' ? formatCurrency(value) : formatNumber(value);
  };

  // Function to get the state color for forecast accuracy
  const getAccuracyStateColor = (value: number) => {
    if (value >= 90) return theme.colors.electricCyan; // High
    if (value >= 70) return '#5fd4d6'; // Medium (using lighterCyan hex value)
    return theme.colors.signalMagenta; // Low
  };

  // Function to get trend icon for demand trend
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Increasing': return '↗';
      case 'Decreasing': return '↘';
      case 'Volatile': return '↕';
      default: return '→';
    }
  };

  // Function to get seasonal strength descriptor
  const getSeasonalStrength = (value: number) => {
    if (value >= 25) return 'Strong';
    if (value >= 15) return 'Moderate';
    return 'Weak';
  };

  // KPI tile style
  const kpiTileStyle = {
    width: '120px',
    height: '120px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.graphite,
    borderRadius: '16px',
    boxShadow: theme.shadows.md,
    padding: '12px',
    position: 'relative' as const,
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* Total Forecast Volume */}
      <div style={kpiTileStyle}>
        <div style={{ 
          fontSize: theme.typography.fontSize['3xl'], 
          fontWeight: theme.typography.fontWeight.semiBold,
          color: theme.colors.cloudWhite,
          marginBottom: '4px',
          textAlign: 'center'
        }}>
          {isLoading ? '—' : formatValue(kpiData.totalForecast).split('.')[0]}
        </div>
        <div style={{ 
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.cloudWhite,
          opacity: 0.7
        }}>
          Total Forecast Volume
        </div>
        {!isLoading && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <div style={{ 
              height: '4px', 
              width: '80%',
              backgroundColor: '#3a4459',
              borderRadius: '2px'
            }}>
              <div style={{ 
                height: '100%', 
                width: `${kpiData.forecastAccuracy}%`,
                backgroundColor: theme.colors.electricCyan,
                borderRadius: '2px'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Forecast Revenue */}
      <div style={kpiTileStyle}>
        <div style={{ 
          fontSize: theme.typography.fontSize['3xl'], 
          fontWeight: theme.typography.fontWeight.semiBold,
          color: theme.colors.cloudWhite,
          marginBottom: '4px',
          textAlign: 'center'
        }}>
          {isLoading ? '—' : formatCurrency(kpiData.totalForecast * 0.8).split('.')[0]}
        </div>
        <div style={{ 
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.cloudWhite,
          opacity: 0.7
        }}>
          Forecast Revenue
        </div>
        {!isLoading && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ 
              fontSize: theme.typography.fontSize.xs,
              color: kpiData.growth >= 0 ? theme.colors.electricCyan : theme.colors.signalMagenta
            }}>
              {kpiData.growth >= 0 ? '+' : ''}{formatPercentage(kpiData.growth / 100)}
            </span>
            <span style={{ 
              fontSize: theme.typography.fontSize.xs,
              color: kpiData.growth >= 0 ? theme.colors.electricCyan : theme.colors.signalMagenta
            }}>
              {kpiData.growth >= 0 ? '↗' : '↘'}
            </span>
          </div>
        )}
      </div>

      {/* Forecast Accuracy */}
      <div style={kpiTileStyle}>
        <div style={{ 
          fontSize: theme.typography.fontSize['3xl'], 
          fontWeight: theme.typography.fontWeight.semiBold,
          color: getAccuracyStateColor(kpiData.forecastAccuracy),
          marginBottom: '4px',
          textAlign: 'center'
        }}>
          {isLoading ? '—' : `${kpiData.forecastAccuracy.toFixed(0)}%`}
        </div>
        <div style={{ 
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.cloudWhite,
          opacity: 0.7,
        }}>
          Model Accuracy
        </div>
        {!isLoading && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '2px'
          }}>
            {/* 5-star rating */}
            {Array.from({ length: 5 }).map((_, i) => (
              <span 
                key={i}
                style={{ 
                  fontSize: theme.typography.fontSize.sm,
                  color: i < Math.round(kpiData.forecastAccuracy / 20) 
                    ? getAccuracyStateColor(kpiData.forecastAccuracy)
                    : '#3a4459'
                }}
              >
                ★
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Demand Trend */}
      <div style={kpiTileStyle}>
        <div style={{ 
          fontSize: theme.typography.fontSize.lg, 
          fontWeight: theme.typography.fontWeight.semiBold,
          color: theme.colors.cloudWhite,
          marginBottom: '8px',
          textAlign: 'center',
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {!isLoading && (
            <>
              <span>{kpiData.demandTrend}</span>
              <span style={{ 
                fontSize: theme.typography.fontSize.xl,
                color: kpiData.demandTrend === 'Increasing' 
                  ? theme.colors.electricCyan 
                  : kpiData.demandTrend === 'Decreasing'
                    ? theme.colors.signalMagenta
                    : theme.colors.cloudWhite
              }}>
                {getTrendIcon(kpiData.demandTrend)}
              </span>
            </>
          )}
        </div>
        <div style={{ 
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.cloudWhite,
          opacity: 0.7
        }}>
          Long-term Trend
        </div>
      </div>

      {/* Seasonal Impact */}
      <div style={kpiTileStyle}>
        <div style={{ 
          fontSize: theme.typography.fontSize['3xl'], 
          fontWeight: theme.typography.fontWeight.semiBold,
          color: theme.colors.electricCyan,
          marginBottom: '4px',
          textAlign: 'center'
        }}>
          {isLoading ? '—' : `${kpiData.seasonalImpact.toFixed(0)}%`}
        </div>
        <div style={{ 
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.cloudWhite,
          opacity: 0.7
        }}>
          Seasonal Variance
        </div>
        {!isLoading && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.cloudWhite,
            opacity: 0.9,
            textAlign: 'center',
            width: '100%'
          }}>
            {getSeasonalStrength(kpiData.seasonalImpact)} seasonality
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiTilesRow;