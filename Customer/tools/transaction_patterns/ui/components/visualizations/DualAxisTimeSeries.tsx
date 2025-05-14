import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ClientSidePlot } from './ClientSidePlot';
import { PlotData } from 'plotly.js';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { selectTransactionData, selectLoading } from '../../state/transactionSlice';
import { useChartConfigs } from '../../utils/chartHelpers';
import { formatDate } from '../../utils/formatters';

export interface DualAxisTimeSeriesProps {
  height?: number;
  width?: number;
  onPointClick?: (dateStr: string, value: number) => void;
}

export const DualAxisTimeSeries: React.FC<DualAxisTimeSeriesProps> = ({
  height = 280,
  width = 640,
  onPointClick
}) => {
  const theme = useTheme();
  const { dualAxisConfig } = useChartConfigs();
  const transactions = useSelector(selectTransactionData);
  const loading = useSelector(selectLoading);
  
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Group transactions by date
    const transactionsByDate = transactions.reduce((acc: Record<string, any>, transaction) => {
      const date = transaction.timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          count: 0,
          totalValue: 0
        };
      }
      
      acc[date].count += 1;
      acc[date].totalValue += transaction.totalValue;
      
      return acc;
    }, {});
    
    // Sort dates
    const sortedDates = Object.keys(transactionsByDate).sort();
    
    // Prepare data arrays
    const dates = sortedDates;
    const counts = sortedDates.map(date => transactionsByDate[date].count);
    const avgValues = sortedDates.map(date => 
      transactionsByDate[date].totalValue / transactionsByDate[date].count
    );
    
    // Format dates for display
    const formattedDates = dates.map(date => formatDate(date));
    
    return [
      {
        type: 'bar',
        x: formattedDates,
        y: counts,
        name: 'Transaction Count',
        marker: {
          color: theme.colors.electricCyan
        },
        hovertemplate: '<b>%{x}</b><br>Count: %{y}<br><extra></extra>'
      },
      {
        type: 'scatter',
        x: formattedDates,
        y: avgValues,
        name: 'Average Value',
        mode: 'lines+markers',
        marker: {
          color: theme.colors.signalMagenta
        },
        line: {
          color: theme.colors.signalMagenta
        },
        yaxis: 'y2',
        hovertemplate: '<b>%{x}</b><br>Avg. Value: $%{y:.2f}<br><extra></extra>'
      }
    ] as PlotData[];
  }, [transactions, theme]);
  
  const handleClick = (event: any) => {
    if (onPointClick && event.points && event.points[0]) {
      const point = event.points[0];
      onPointClick(point.x, point.y);
    }
  };
  
  return (
    <Card 
      title="Transaction Volume and Average Value Over Time"
      isLoading={loading}
      elevation="md"
    >
      {transactions && transactions.length > 0 && (
        <ClientSidePlot
          data={chartData}
          layout={{
            ...dualAxisConfig,
            height,
            width,
            xaxis: {
              ...dualAxisConfig.xaxis,
              title: 'Date'
            },
            yaxis: {
              ...dualAxisConfig.yaxis,
              title: 'Transaction Count'
            },
            yaxis2: {
              ...dualAxisConfig.yaxis2,
              title: 'Avg. Transaction Value ($)'
            }
          }}
          onClick={handleClick}
        />
      )}
    </Card>
  );
}; 