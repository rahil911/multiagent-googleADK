import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ReferenceLine, Area 
} from 'recharts';
import { ForecastData, ForecastHorizon, ForecastMetric } from '../../types';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { formatCurrency, formatNumber, formatDate, getConfidenceIntervalColor } from '../../utils/chartHelpers';
import ChartWrapper from '../common/ChartWrapper';

interface ForecastLineChartProps {
  data: ForecastData[];
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  confidenceLevel: number;
  showConfidenceInterval?: boolean;
  height?: number | string;
  title?: string;
  lineColor?: string;
  areaColor?: string;
  showReferenceLine?: boolean;
  isLoading?: boolean;
}

const ForecastLineChart: React.FC<ForecastLineChartProps> = ({
  data,
  horizon,
  metric,
  confidenceLevel,
  showConfidenceInterval = true,
  height = 400,
  title = 'Forecast Projection',
  lineColor,
  areaColor,
  showReferenceLine = true,
  isLoading = false,
}) => {
  const theme = useTheme();
  
  // Format value for tooltip and axes
  const formatValue = (value: number) => {
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
      const date = formatDate(label, horizon);
      const data = payload[0].payload;

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
            {date}
          </p>
          
          {data.actual > 0 && (
            <p style={{ 
              color: theme.colors.electricCyan,
              margin: '4px 0',
              fontSize: theme.typography.fontSize.sm
            }}>
              Actual: {formatValue(data.actual)}
            </p>
          )}
          
          {data.forecast > 0 && (
            <>
              <p style={{ 
                color: theme.colors.signalMagenta,
                margin: '4px 0',
                fontSize: theme.typography.fontSize.sm
              }}>
                Forecast: {formatValue(data.forecast)}
              </p>
              {showConfidenceInterval && (
                <>
                  <p style={{ 
                    color: theme.colors.signalMagenta,
                    opacity: 0.7,
                    margin: '4px 0',
                    fontSize: theme.typography.fontSize.sm
                  }}>
                    Range: {formatValue(data.lowerBound)} - {formatValue(data.upperBound)}
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
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Find separator index between historical and forecast data
  const separatorIndex = data.findIndex(d => d.forecast > 0 && d.actual === 0);
  
  return (
    <ChartWrapper
      title={title}
      height={height}
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
            tickFormatter={(value) => formatValue(value)}
            stroke={theme.colors.cloudWhite}
            tick={{ fill: theme.colors.cloudWhite, fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
          
          {/* Reference line at transition from actual to forecast */}
          {showReferenceLine && separatorIndex >= 0 && (
            <ReferenceLine 
              x={data[separatorIndex]?.date} 
              label={{ 
                value: 'Today', 
                position: 'insideTopRight',
                fill: theme.colors.cloudWhite,
                fontSize: 12
              }} 
              stroke={theme.colors.cloudWhite}
              strokeDasharray="3 3"
            />
          )}
          
          {/* Historical data */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke={lineColor || theme.colors.electricCyan}
            strokeWidth={3}
            dot={{ r: 4, fill: lineColor || theme.colors.electricCyan }}
            activeDot={{ r: 6, fill: lineColor || theme.colors.electricCyan }}
            name="Historical"
          />
          
          {/* Forecast data */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke={lineColor || theme.colors.signalMagenta}
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: lineColor || theme.colors.signalMagenta }}
            activeDot={{ r: 6, fill: lineColor || theme.colors.signalMagenta }}
            name="Forecast"
          />
          
          {/* Confidence interval */}
          {showConfidenceInterval && (
            <>
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="transparent"
                fill={areaColor || getConfidenceIntervalColor(confidenceLevel)}
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
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default ForecastLineChart; 