import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Product } from '../../types/index';
import { formatCurrency } from '../../utils/formatters';
import { generateChartLayout } from '../../utils/chartHelpers';

// Import Plotly dynamically with SSR disabled
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface SalesPerformanceExplorerProps {
  data: Product[];
  loading?: boolean;
  title?: string;
  onProductSelect?: (product: Product) => void;
  height?: number;
  width?: number;
}

type ChartType = 'bar' | 'treemap' | 'bubble';

/**
 * Sales Performance Explorer Visualization
 * Shows product sales performance with switchable chart types
 */
export const SalesPerformanceExplorer: React.FC<SalesPerformanceExplorerProps> = ({
  data,
  loading = false,
  title = 'Sales Performance Explorer',
  onProductSelect,
  height = 480,
  width = 720,
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<ChartType>('bar');
  
  // Sort data by sales amount
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.sales_amount - a.sales_amount).slice(0, 15);
  }, [data]);
  
  // Prepare chart data based on selected chart type
  const chartData = useMemo(() => {
    switch (chartType) {
      case 'bar':
        return [{
          type: 'bar',
          x: sortedData.map(p => p.sales_amount),
          y: sortedData.map(p => p.product_name),
          orientation: 'h',
          text: sortedData.map(p => formatCurrency(p.sales_amount)),
          textposition: 'auto',
          hoverinfo: 'text+y',
          marker: {
            color: sortedData.map(p => p.sales_amount),
            colorscale: [
              [0, theme.colors.electricCyan],
              [0.5, theme.colors.electricCyan],
              [1, theme.colors.signalMagenta]
            ],
          },
        }];
        
      case 'treemap':
        return [{
          type: 'treemap',
          labels: sortedData.map(p => p.product_name),
          parents: sortedData.map(p => p.category || ''),
          values: sortedData.map(p => p.sales_amount),
          textinfo: 'label+value',
          marker: {
            colorscale: [
              [0, theme.colors.electricCyan],
              [0.5, '#43cad0'],
              [1, theme.colors.signalMagenta]
            ],
            colors: sortedData.map(p => p.sales_amount),
          },
          hoverinfo: 'label+value+text',
          text: sortedData.map(p => `Category: ${p.category}<br>Subcategory: ${p.subcategory}`),
        }];
        
      case 'bubble':
        return [{
          type: 'scatter',
          x: sortedData.map(p => p.quantity),
          y: sortedData.map(p => p.sales_amount / p.quantity),
          mode: 'markers',
          marker: {
            size: sortedData.map(p => Math.min(Math.max(p.sales_amount / 1000, 10), 40)),
            color: sortedData.map(p => p.sales_amount),
            colorscale: [
              [0, theme.colors.electricCyan],
              [0.5, '#43cad0'],
              [1, theme.colors.signalMagenta]
            ],
          },
          text: sortedData.map(p => p.product_name),
          hoverinfo: 'text+x+y',
        }];
        
      default:
        return [];
    }
  }, [chartType, sortedData, theme]);
  
  // Generate layout based on chart type
  const chartLayout = useMemo(() => {
    const baseLayout = generateChartLayout(theme, {
      height,
      width,
      autosize: true,
      margin: { l: 120, r: 20, b: 50, t: 30 },
    });
    
    switch (chartType) {
      case 'bar':
        return {
          ...baseLayout,
          xaxis: {
            ...baseLayout.xaxis,
            title: 'Sales Amount ($)',
          },
          yaxis: {
            ...baseLayout.yaxis,
            title: '',
          },
        };
        
      case 'treemap':
        return baseLayout;
        
      case 'bubble':
        return {
          ...baseLayout,
          xaxis: {
            ...baseLayout.xaxis,
            title: 'Units Sold',
          },
          yaxis: {
            ...baseLayout.yaxis,
            title: 'Average Price ($)',
          },
        };
        
      default:
        return baseLayout;
    }
  }, [chartType, theme, height, width]);
  
  // Handle chart click
  const handleClick = (event: any) => {
    if (!onProductSelect || !event.points || !event.points[0]) return;
    
    const index = event.points[0].pointIndex;
    if (index !== undefined && index < sortedData.length) {
      onProductSelect(sortedData[index]);
    }
  };
  
  const chartTypeButtons = [
    { label: 'Bar', type: 'bar' },
    { label: 'Treemap', type: 'treemap' },
    { label: 'Bubble', type: 'bubble' },
  ];
  
  // Chart actions
  const actions = (
    <div style={{ display: 'flex', gap: '8px' }}>
      {chartTypeButtons.map(button => (
        <button
          key={button.type}
          onClick={() => setChartType(button.type as ChartType)}
          style={{
            background: chartType === button.type ? theme.colors.electricCyan : theme.colors.midnight,
            color: theme.colors.cloudWhite,
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
  
  return (
    <Card 
      title={title}
      elevation="md"
      isLoading={loading}
      actions={actions}
    >
      <Plot
        data={chartData as any}
        layout={chartLayout as any}
        config={{ responsive: true }}
        onClick={handleClick}
      />
    </Card>
  );
};

export default SalesPerformanceExplorer; 