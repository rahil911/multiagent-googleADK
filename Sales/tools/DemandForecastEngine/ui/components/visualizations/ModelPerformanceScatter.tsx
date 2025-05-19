import React from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { ForecastMetric } from '../../types';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { formatCurrency, formatNumber, getErrorColor } from '../../utils/chartHelpers';
import ChartWrapper from '../common/ChartWrapper';

// Define the type of data point for the scatter chart
interface ScatterPoint {
  actual: number;
  predicted: number;
  period?: string;
  error: number;
  errorMagnitude: 'low' | 'medium' | 'high';
}

interface ModelPerformanceScatterProps {
  data: ScatterPoint[];
  metric: ForecastMetric;
  title?: string;
  subtitle?: string;
  height?: number | string;
  isLoading?: boolean;
}

const ModelPerformanceScatter: React.FC<ModelPerformanceScatterProps> = ({
  data,
  metric,
  title = 'Forecast Accuracy',
  subtitle = 'Actual vs. Predicted Values',
  height = 400,
  isLoading = false,
}) => {
  const theme = useTheme();
  
  // Format value for tooltip and axes
  const formatValue = (value: number) => {
    return metric === 'revenue' ? formatCurrency(value) : formatNumber(value);
  };
  
  // Format value for ticks to keep axis labels short
  const formatTick = (value: number) => {
    return metric === 'revenue' 
      ? `$${(value/1000).toFixed(0)}K` 
      : value >= 1000 
        ? `${(value/1000).toFixed(0)}K` 
        : value.toString();
  };

  // Custom tooltip for scatter plot
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: theme.colors.midnight,
          padding: theme.spacing[3],
          border: `1px solid ${theme.colors.electricCyan}`,
          borderRadius: '8px',
          boxShadow: theme.shadows.md
        }}>
          {data.period && (
            <p style={{ 
              color: theme.colors.cloudWhite, 
              fontWeight: theme.typography.fontWeight.semiBold,
              margin: '0 0 8px 0'
            }}>
              {data.period}
            </p>
          )}
          <p style={{ 
            color: theme.colors.electricCyan,
            margin: '4px 0',
            fontSize: theme.typography.fontSize.sm
          }}>
            Actual: {formatValue(data.actual)}
          </p>
          <p style={{ 
            color: theme.colors.signalMagenta,
            margin: '4px 0',
            fontSize: theme.typography.fontSize.sm
          }}>
            Predicted: {formatValue(data.predicted)}
          </p>
          <p style={{ 
            color: getErrorColor(data.errorMagnitude),
            margin: '4px 0',
            fontSize: theme.typography.fontSize.sm
          }}>
            Error: {(data.error * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      height={height}
      isLoading={isLoading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={`${theme.colors.graphiteDark}33`} />
          <XAxis 
            type="number" 
            dataKey="actual" 
            name="Actual" 
            tick={{ fill: theme.colors.cloudWhite }}
            stroke={theme.colors.cloudWhite}
            label={{
              value: 'Actual',
              position: 'insideBottomRight',
              offset: -10,
              fill: theme.colors.cloudWhite,
            }}
            tickFormatter={formatTick}
          />
          <YAxis 
            type="number" 
            dataKey="predicted" 
            name="Predicted" 
            tick={{ fill: theme.colors.cloudWhite }}
            stroke={theme.colors.cloudWhite}
            label={{
              value: 'Predicted',
              angle: -90,
              position: 'insideLeft',
              fill: theme.colors.cloudWhite,
            }}
            tickFormatter={formatTick}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          
          {/* Perfect prediction reference line */}
          <ReferenceLine 
            segment={[
              { x: 0, y: 0 },
              { x: data.length ? Math.max(...data.map(d => d.actual)) * 1.2 : 3000, 
                y: data.length ? Math.max(...data.map(d => d.actual)) * 1.2 : 3000 }
            ]} 
            stroke={theme.colors.cloudWhite}
            strokeDasharray="5 5"
          />
          
          {/* 5% error bands */}
          <ReferenceLine 
            segment={[
              { x: 0, y: 0 },
              { x: data.length ? Math.max(...data.map(d => d.actual)) * 1.2 : 3000, 
                y: data.length ? Math.max(...data.map(d => d.actual)) * 1.2 * 1.05 : 3150 }
            ]} 
            stroke={theme.colors.cloudWhite}
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />
          <ReferenceLine 
            segment={[
              { x: 0, y: 0 },
              { x: data.length ? Math.max(...data.map(d => d.actual)) * 1.2 : 3000, 
                y: data.length ? Math.max(...data.map(d => d.actual)) * 1.2 * 0.95 : 2850 }
            ]} 
            stroke={theme.colors.cloudWhite}
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />
          
          <Scatter 
            name="Forecast Error" 
            data={data} 
            shape="circle"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getErrorColor(entry.errorMagnitude)} 
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default ModelPerformanceScatter; 