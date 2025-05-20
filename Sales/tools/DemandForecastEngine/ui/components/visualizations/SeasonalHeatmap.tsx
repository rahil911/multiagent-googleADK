import React from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { formatPercentage } from '../../utils/chartHelpers';
import ChartWrapper from '../common/ChartWrapper';

interface YearData {
  year: number;
  [month: string]: number | string;
}

interface SeasonalHeatmapProps {
  data: YearData[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  isLoading?: boolean;
  showValues?: boolean;
  valueThreshold?: number;
  colorScale?: (value: number) => string;
}

const SeasonalHeatmap: React.FC<SeasonalHeatmapProps> = ({
  data,
  title = 'Seasonal Heatmap',
  subtitle = 'Multi-Year Pattern Analysis',
  height = 300,
  isLoading = false,
  showValues = true,
  valueThreshold = 1.15,
  colorScale,
}) => {
  const theme = useTheme();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Default color scale
  const getDefaultColor = (value: number) => {
    if (value >= 1.2) return theme.colors.signalMagenta;
    if (value >= 1.1) return theme.colors.electricCyan;
    if (value >= 1.0) return "#3e7b97"; // blue-gray
    return theme.colors.midnight;
  };
  
  // Use provided color scale or default
  const getColor = colorScale || getDefaultColor;

  return (
    <ChartWrapper
      title={title}
      subtitle={subtitle}
      height={height}
      isLoading={isLoading}
    >
      <div style={{ 
        width: '100%', 
        height: '100%',
        display: 'grid',
        gridTemplateRows: `minmax(24px, auto) repeat(${data.length}, minmax(24px, 1fr))`,
        gridTemplateColumns: `80px repeat(12, 1fr)`,
        gap: '2px',
        backgroundColor: theme.colors.graphiteDark,
        borderRadius: '4px',
        overflow: 'hidden',
        minHeight: data.length * 28 + 28
      }}>
        {/* Header row with month names */}
        <div style={{ 
          backgroundColor: theme.colors.midnight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.colors.cloudWhite,
          fontWeight: theme.typography.fontWeight.semiBold,
          fontSize: theme.typography.fontSize.xs,
          minHeight: '28px',
          padding: '4px 0'
        }}>
          Year
        </div>
        {months.map(month => (
          <div key={month} style={{ 
            backgroundColor: theme.colors.midnight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.cloudWhite,
            fontSize: theme.typography.fontSize.xs,
            minHeight: '28px',
            padding: '4px 0'
          }}>
            {month}
          </div>
        ))}
        
        {/* Data rows */}
        {data.map((yearData, yearIndex) => (
          <React.Fragment key={yearData.year}>
            {/* Year label */}
            <div style={{ 
              backgroundColor: theme.colors.midnight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.cloudWhite,
              fontWeight: theme.typography.fontWeight.medium,
              fontSize: theme.typography.fontSize.xs,
              minHeight: '24px',
              padding: '4px 0'
            }}>
              {yearData.year}
            </div>
            
            {/* Month cells */}
            {months.map(month => {
              const value = typeof yearData[month] === 'number' ? yearData[month] as number : 1;
              return (
                <div 
                  key={`${yearData.year}-${month}`}
                  style={{ 
                    backgroundColor: getColor(value),
                    position: 'relative',
                    cursor: 'pointer',
                    minHeight: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={`${month} ${yearData.year}: ${formatPercentage(value - 1)} vs average`}
                >
                  {showValues && value > valueThreshold && (
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.cloudWhite,
                      fontWeight: theme.typography.fontWeight.bold,
                      whiteSpace: 'nowrap',
                      textShadow: '0 0 3px rgba(0,0,0,0.9)',
                      pointerEvents: 'none'
                    }}>
                      {formatPercentage(value - 1)}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </ChartWrapper>
  );
};

export default SeasonalHeatmap; 