import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter, ForecastData } from '../../types';
import { formatCurrency, formatNumber, formatPercentage, formatDate, getConfidenceIntervalColor } from '../../utils/chartHelpers';
import ChartWrapper from '../common/ChartWrapper';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import Button from '../../../../../../ui-common/design-system/components/Button';
import Select from '../../../../../../ui-common/design-system/components/Select';

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
  enhanceSelectInteraction?: boolean; // Optional prop for improving select interaction
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
  enhanceSelectInteraction,
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
            <div>
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
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Chart actions
  const actions = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button 
        variant="secondary"
        size="sm"
      >
        Export
      </Button>
      <Button 
        variant="secondary"
        size="sm"
      >
        Share
      </Button>
    </div>
  );

  // Filter components
  const FilterControls = () => {
    // Product filter
    const ProductFilter = () => {
      const products = ["All Products", "Product A", "Product B", "Product C"];
      const productOptions = products.map(product => ({
        value: product,
        label: product
      }));
      
      return (
        <Select 
          options={productOptions}
          value={filters.product || "All Products"}
          onChange={(value) => onFilterChange({ 
            ...filters, 
            product: value && value !== "All Products" ? value : undefined 
          })}
          placeholder="Select product"
          size="sm"
          style={{ 
            width: '160px', 
            ...(enhanceSelectInteraction ? { 
              zIndex: 9999,
              position: 'relative'
            } : {})
          }}
          className={enhanceSelectInteraction ? "enhanced-select" : ""}
        />
      );
    };

    // Region filter
    const RegionFilter = () => {
      const regions = ["All Regions", "North", "South", "East", "West"];
      const regionOptions = regions.map(region => ({
        value: region,
        label: region
      }));
      
      return (
        <Select 
          options={regionOptions}
          value={filters.region || "All Regions"}
          onChange={(value) => onFilterChange({ 
            ...filters, 
            region: value && value !== "All Regions" ? value : undefined 
          })}
          placeholder="Select region"
          size="sm"
          style={{ 
            width: '160px',
            ...(enhanceSelectInteraction ? { 
              zIndex: 9998,
              position: 'relative'
            } : {})
          }}
          className={enhanceSelectInteraction ? "enhanced-select" : ""}
        />
      );
    };

    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <ProductFilter />
        <RegionFilter />
        {Object.keys(filters).length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        gap: '12px',
        width: '100%'
      }}>
        {/* Controls row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          gap: '12px',
          flexWrap: 'wrap',
          flexShrink: 0 // Prevent controls from shrinking
        }}>
          {/* Forecast period selector */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: theme.colors.midnight, 
            borderRadius: '24px', 
            padding: '4px' 
          }}>
            {(['week', 'month', 'quarter', 'year'] as ForecastHorizon[]).map((period) => (
              <Button
                key={period}
                variant={horizon === period ? "primary" : "secondary"}
                size="sm"
                onClick={() => onHorizonChange(period)}
                style={{ flex: 1 }}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
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
              <Button
                key={metricOption}
                variant={metric === metricOption ? "primary" : "secondary"}
                size="sm"
                onClick={() => onMetricChange(metricOption)}
                style={{ flex: 1 }}
              >
                {metricOption.charAt(0).toUpperCase() + metricOption.slice(1)}
              </Button>
            ))}
          </div>

          {/* Filters */}
          <FilterControls />
        </div>

        {/* Confidence level slider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          flexShrink: 0 // Prevent slider from shrinking
        }}>
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
        <div style={{ 
          flex: 1, 
          minHeight: 0, // Critical for flexbox children with percentage heights
          position: 'relative',
          width: '100%'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={forecastData}
              margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.colors.midnight}
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke={theme.colors.cloudWhite}
                tick={{ fill: theme.colors.cloudWhite }}
              />
              <YAxis 
                tickFormatter={(value) => metric === 'revenue' ? formatCurrency(value) : formatNumber(value)}
                stroke={theme.colors.cloudWhite}
                tick={{ fill: theme.colors.cloudWhite }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Reference line for current date */}
              <ReferenceLine 
                x={new Date().toISOString().split('T')[0]} 
                stroke={theme.colors.cloudWhite} 
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ 
                  value: 'Today', 
                  position: 'insideTopRight',
                  fill: theme.colors.cloudWhite
                }}
              />
              
              {/* Confidence interval area */}
              <Area 
                type="monotone" 
                dataKey="upperBound" 
                stroke="none" 
                fill={getConfidenceIntervalColor(confidenceLevel)}
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="lowerBound" 
                stroke="none" 
                fill={getConfidenceIntervalColor(confidenceLevel)}
                fillOpacity={0.3}
              />
              
              {/* Historical line */}
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke={theme.colors.electricCyan} 
                strokeWidth={3} 
                dot={{ r: 4, fill: theme.colors.electricCyan }}
                activeDot={{ r: 6, fill: theme.colors.electricCyan }}
              />
              
              {/* Forecast line */}
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke={theme.colors.signalMagenta} 
                strokeWidth={3} 
                strokeDasharray="5 5"
                dot={{ r: 4, fill: theme.colors.signalMagenta }} 
                activeDot={{ r: 6, fill: theme.colors.signalMagenta }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* KPI summary */}
        <div style={{ 
          display: 'flex',
          gap: '24px',
          padding: '12px',
          backgroundColor: theme.colors.midnight,
          borderRadius: '8px',
          flexShrink: 0
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.cloudWhite }}>
              {horizon.charAt(0).toUpperCase() + horizon.slice(1)}ly Forecast (Total)
            </div>
            <div style={{ 
              fontSize: theme.typography.fontSize.xl, 
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.cloudWhite 
            }}>
              {metric === 'revenue' ? formatCurrency(totalForecast) : formatNumber(totalForecast)}
            </div>
          </div>
          
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.cloudWhite }}>
              Growth Projection
            </div>
            <div style={{ 
              fontSize: theme.typography.fontSize.xl, 
              fontWeight: theme.typography.fontWeight.bold,
              color: growthProjection >= 0 ? theme.colors.success : theme.colors.error
            }}>
              {formatPercentage(growthProjection)}
            </div>
          </div>
          
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.cloudWhite }}>
              Average {horizon.charAt(0).toUpperCase() + horizon.slice(1)}ly
            </div>
            <div style={{ 
              fontSize: theme.typography.fontSize.xl, 
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.cloudWhite 
            }}>
              {metric === 'revenue' ? formatCurrency(averageDaily) : formatNumber(averageDaily)}
            </div>
          </div>
        </div>
      </div>
    </ChartWrapper>
  );
};

export default ForecastHorizonExplorer;