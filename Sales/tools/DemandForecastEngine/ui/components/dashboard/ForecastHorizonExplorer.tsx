import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter, ForecastData } from '../../types';
import { formatCurrency, formatNumber, formatPercentage, formatDate, getConfidenceIntervalColor } from '../../utils/chartHelpers';
import ChartWrapper from '../common/ChartWrapper';
import { useTheme } from '../../../../../../ui-common/design-system/theme';

interface ForecastHorizonExplorerProps {
  horizon: ForecastHorizon;
  onHorizonChange: (horizon: ForecastHorizon) => void;
  metric: ForecastMetric;
  onMetricChange: (metric: ForecastMetric) => void;
  confidenceLevel: number;
  onConfidenceLevelChange: (level: number) => void;
  filters: DimensionFilter;
  onFilterChange: (filters: DimensionFilter) => void;
  onClearFilters: () => void;
  data?: ForecastData[]; // Optional prop for when data is passed from parent
}

const ForecastHorizonExplorer: React.FC<ForecastHorizonExplorerProps> = ({
  horizon,
  onHorizonChange,
  metric,
  onMetricChange,
  confidenceLevel,
  onConfidenceLevelChange,
  filters,
  onFilterChange,
  onClearFilters,
  data: externalData,
}) => {
  const theme = useTheme();
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalForecast, setTotalForecast] = useState<number>(0);
  const [growthProjection, setGrowthProjection] = useState<number>(0);
  const [averageDaily, setAverageDaily] = useState<number>(0);

  // Simulating data fetch on parameter changes
  useEffect(() => {
    if (externalData) {
      setForecastData(externalData);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchData = () => {
      // Generate mock data based on selected parameters
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
      let totalForecastSum = 0;
      
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
        
        const forecastPoint = {
          date: date.toISOString().split('T')[0],
          actual: 0, // No actual for forecast data
          forecast: forecast,
          lowerBound: forecast - interval,
          upperBound: forecast + interval,
        };
        
        data.push(forecastPoint);
        totalForecastSum += forecast;
      }
      
      // Calculate aggregate metrics
      const avgDailyValue = totalForecastSum / 12;
      const lastHistoricalPeriodValue = data[11].actual;
      const firstForecastPeriodValue = data[12].forecast;
      const growth = (firstForecastPeriodValue - lastHistoricalPeriodValue) / lastHistoricalPeriodValue;
      
      setTotalForecast(totalForecastSum);
      setAverageDaily(avgDailyValue);
      setGrowthProjection(growth);
      setForecastData(data);
      setLoading(false);
    };
    
    // Simulate API delay
    setTimeout(fetchData, 500);
  }, [horizon, metric, confidenceLevel, filters, externalData]);

  // Format value for tooltip
  const formatTooltipValue = (value: number) => {
    if (value === 0) return '-';
    return metric === 'revenue' ? formatCurrency(value) : formatNumber(value);
  };

  // Format date for X-axis
  const formatXAxis = (dateStr: string) => {
    return formatDate(dateStr, horizon);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(label);
      const formattedDate = formatDate(label, horizon);

      return (
        <div style={{
          backgroundColor: theme.colors.midnight,
          padding: theme.spacing[3],
          border: `1px solid ${theme.colors.electricCyan}`,
          borderRadius: '8px',
          boxShadow: theme.shadows.md
        }}>
          <p style={{ 
            color: theme.colors.cloudWhite, 
            fontWeight: theme.typography.fontWeight.semiBold,
            margin: '0 0 8px 0'
          }}>
            {formattedDate}
          </p>
          
          {data.actual > 0 && (
            <p style={{ 
              color: theme.colors.electricCyan,
              margin: '4px 0',
              fontSize: theme.typography.fontSize.sm
            }}>
              Actual: {formatTooltipValue(data.actual)}
            </p>
          )}
          
          {data.forecast > 0 && (
            <>
              <p style={{ 
                color: theme.colors.signalMagenta,
                margin: '4px 0',
                fontSize: theme.typography.fontSize.sm
              }}>
                Forecast: {formatTooltipValue(data.forecast)}
              </p>
              <p style={{ 
                color: theme.colors.signalMagenta,
                opacity: 0.7,
                margin: '4px 0',
                fontSize: theme.typography.fontSize.sm
              }}>
                Range: {formatTooltipValue(data.lowerBound)} - {formatTooltipValue(data.upperBound)}
              </p>
              <p style={{ 
                color: theme.colors.cloudWhite,
                opacity: 0.8,
                margin: '4px 0',
                fontSize: theme.typography.fontSize.xs
              }}>
                Confidence: {confidenceLevel}%
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Button styles
  const buttonStyle = (active: boolean) => ({
    flex: 1,
    padding: '8px 16px',
    borderRadius: '24px',
    backgroundColor: active ? theme.colors.electricCyan : theme.colors.midnight,
    color: active ? theme.colors.midnight : theme.colors.cloudWhite,
    border: 'none',
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.sm,
  });

  // Chart actions
  const actions = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button 
        style={{
          backgroundColor: 'transparent',
          color: theme.colors.cloudWhite,
          border: `1px solid ${theme.colors.graphiteDark}`,
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: theme.typography.fontSize.sm,
          cursor: 'pointer'
        }}
      >
        Export
      </button>
      <button 
        style={{
          backgroundColor: 'transparent',
          color: theme.colors.cloudWhite,
          border: `1px solid ${theme.colors.graphiteDark}`,
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: theme.typography.fontSize.sm,
          cursor: 'pointer'
        }}
      >
        Share
      </button>
    </div>
  );

  // Filter components
  const FilterControls = () => {
    // Product filter
    const ProductFilter = () => {
      const products = ["All Products", "Product A", "Product B", "Product C"];
      return (
        <select 
          style={{
            backgroundColor: theme.colors.midnight,
            color: theme.colors.cloudWhite,
            padding: '8px 12px',
            borderRadius: '4px',
            border: `1px solid ${theme.colors.graphiteDark}`,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.sm,
          }}
          value={filters.product || "All Products"}
          onChange={(e) => onFilterChange({ ...filters, product: e.target.value !== "All Products" ? e.target.value : undefined })}
        >
          {products.map(product => (
            <option key={product} value={product}>{product}</option>
          ))}
        </select>
      );
    };

    // Region filter
    const RegionFilter = () => {
      const regions = ["All Regions", "North", "South", "East", "West"];
      return (
        <select 
          style={{
            backgroundColor: theme.colors.midnight,
            color: theme.colors.cloudWhite,
            padding: '8px 12px',
            borderRadius: '4px',
            border: `1px solid ${theme.colors.graphiteDark}`,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.sm,
          }}
          value={filters.region || "All Regions"}
          onChange={(e) => onFilterChange({ ...filters, region: e.target.value !== "All Regions" ? e.target.value : undefined })}
        >
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      );
    };

    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <ProductFilter />
        <RegionFilter />
        {Object.keys(filters).length > 0 && (
          <button
            style={{
              backgroundColor: 'transparent',
              color: theme.colors.electricCyan,
              border: 'none',
              padding: '4px 8px',
              cursor: 'pointer',
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.fontSize.sm,
            }}
            onClick={onClearFilters}
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  };

  return (
    <ChartWrapper
      title="Forecast Horizon Explorer"
      isLoading={loading}
      height={560}
      actions={actions}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
        {/* Controls row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Forecast period selector */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: theme.colors.midnight, 
            borderRadius: '24px', 
            padding: '4px' 
          }}>
            {(['week', 'month', 'quarter', 'year'] as ForecastHorizon[]).map((period) => (
              <button
                key={period}
                style={buttonStyle(horizon === period)}
                onClick={() => onHorizonChange(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {/* Metric selector */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: theme.colors.midnight, 
            borderRadius: '24px', 
            padding: '4px' 
          }}>
            {(['quantity', 'revenue'] as ForecastMetric[]).map((metricOption) => (
              <button
                key={metricOption}
                style={buttonStyle(metric === metricOption)}
                onClick={() => onMetricChange(metricOption)}
              >
                {metricOption.charAt(0).toUpperCase() + metricOption.slice(1)}
              </button>
            ))}
          </div>

          {/* Filters */}
          <FilterControls />
        </div>

        {/* Confidence level slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ 
            color: theme.colors.cloudWhite, 
            fontSize: theme.typography.fontSize.sm,
            minWidth: '105px'
          }}>
            Confidence: {confidenceLevel}%
          </span>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={confidenceLevel}
            onChange={(e) => onConfidenceLevelChange(Number(e.target.value))}
            style={{ 
              flex: 1,
              accentColor: theme.colors.electricCyan
            }}
          />
        </div>

        {/* Main chart */}
        <div style={{ flex: 1, minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={forecastData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={`${theme.colors.graphiteDark}33`} 
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke={theme.colors.cloudWhite}
                tick={{ fill: theme.colors.cloudWhite, fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatTooltipValue(value)}
                stroke={theme.colors.cloudWhite}
                tick={{ fill: theme.colors.cloudWhite, fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
              
              {/* Today reference line */}
              <ReferenceLine 
                x={forecastData[11]?.date} 
                label={{ 
                  value: 'Today', 
                  position: 'insideTopRight',
                  fill: theme.colors.cloudWhite,
                  fontSize: 12
                }} 
                stroke={theme.colors.cloudWhite}
                strokeDasharray="3 3"
              />
              
              {/* Historical data */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke={theme.colors.electricCyan}
                strokeWidth={3}
                dot={{ r: 4, fill: theme.colors.electricCyan }}
                activeDot={{ r: 6, fill: theme.colors.electricCyan }}
                name="Historical"
              />
              
              {/* Forecast data */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke={theme.colors.signalMagenta}
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: theme.colors.signalMagenta }}
                activeDot={{ r: 6, fill: theme.colors.signalMagenta }}
                name="Forecast"
              />
              
              {/* Confidence interval */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="transparent"
                fill={getConfidenceIntervalColor(confidenceLevel)}
                fillOpacity={0.3}
                name="Upper Bound"
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="transparent"
                fill={theme.colors.signalMagenta}
                fillOpacity={0.0}
                name="Lower Bound"
                legendType="none"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '16px',
          backgroundColor: theme.colors.midnight,
          borderRadius: '8px'
        }}>
          <div>
            <div style={{ 
              fontSize: theme.typography.fontSize.lg, 
              color: theme.colors.cloudWhite,
              fontWeight: theme.typography.fontWeight.semiBold
            }}>
              Total {horizon} forecast: {formatTooltipValue(totalForecast)}
            </div>
            <div style={{ 
              fontSize: theme.typography.fontSize.sm, 
              color: theme.colors.cloudWhite,
              opacity: 0.7,
              marginTop: '4px'
            }}>
              Growth: {formatPercentage(growthProjection)} vs previous {horizon}
            </div>
          </div>
          <div style={{ 
            fontSize: theme.typography.fontSize.md, 
            color: theme.colors.cloudWhite,
            opacity: 0.9,
            alignSelf: 'center'
          }}>
            Avg per {horizon}: {formatTooltipValue(averageDaily)}
          </div>
        </div>
      </div>
    </ChartWrapper>
  );
};

export default ForecastHorizonExplorer;