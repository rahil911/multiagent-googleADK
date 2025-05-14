import React, { useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { PlotData } from 'plotly.js';
import { ClientSidePlot } from './ClientSidePlot';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { selectTemporalHeatmap, selectLoading } from '../../state/transactionSlice';
import { useChartConfigs } from '../../utils/chartHelpers';
import { formatHour } from '../../utils/formatters';

export interface TemporalHeatmapProps {
  height?: number;
  width?: number;
  onCellClick?: (hour: number, day: string) => void;
}

export const TemporalHeatmap: React.FC<TemporalHeatmapProps> = ({
  height = 280,
  width = 400,
  onCellClick
}) => {
  const theme = useTheme();
  const { heatmapColorscale, hoverTemplates } = useChartConfigs();
  const temporalHeatmap = useSelector(selectTemporalHeatmap);
  const loading = useSelector(selectLoading);
  
  const chartData = useMemo(() => {
    if (!temporalHeatmap) return [];
    
    const { hourlyMatrix, days, hours } = temporalHeatmap;
    
    // Format hours for display (12-hour format)
    const formattedHours = hours.map(hour => formatHour(hour));
    
    return [{
      type: 'heatmap',
      z: hourlyMatrix,
      x: formattedHours,
      y: days,
      colorscale: [
        [0, theme.colors.midnight],
        [1, theme.colors.electricCyan]
      ],
      hoverongaps: false,
      hovertemplate: 'Day: %{y}<br>Hour: %{x}<br>Transactions: %{z}<extra></extra>'
    }] as PlotData[];
  }, [temporalHeatmap, theme.colors]);
  
  const handleClick = (event: any) => {
    if (onCellClick && event.points && event.points[0]) {
      const point = event.points[0];
      const hour = point.pointNumber[1]; // x-index corresponds to hour
      const day = point.y; // y-value is the day name
      onCellClick(hour, day);
    }
  };
  
  return (
    <Card 
      title="Transaction Density by Day and Hour"
      isLoading={loading}
      elevation="md"
    >
      {temporalHeatmap && chartData.length > 0 && (
        <ClientSidePlot
          data={chartData}
          layout={{
            height,
            width,
            margin: { l: 40, r: 20, t: 10, b: 30 },
            paper_bgcolor: theme.colors.graphite,
            plot_bgcolor: theme.colors.graphite,
            font: { 
              family: theme.typography.fontFamily,
              color: theme.colors.cloudWhite 
            },
            xaxis: {
              title: 'Hour of Day',
              titlefont: {
                size: 12
              }
            },
            yaxis: {
              title: 'Day of Week',
              titlefont: {
                size: 12
              }
            }
          }}
          onClick={handleClick}
        />
      )}
    </Card>
  );
}; 