import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Product } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { generateChartLayout } from '../../utils/chartHelpers';

// Import Plotly dynamically with SSR disabled
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface MarginAnalysisVisualizerProps {
  data: Product[];
  loading?: boolean;
  title?: string;
  onProductSelect?: (product: Product) => void;
  height?: number;
  width?: number;
}

/**
 * Margin Analysis Visualizer
 * Shows product sales vs margin scatter plot with margin distribution
 */
export const MarginAnalysisVisualizer: React.FC<MarginAnalysisVisualizerProps> = ({
  data,
  loading = false,
  title = 'Margin Analysis',
  onProductSelect,
  height = 440,
  width = 680,
}) => {
  const theme = useTheme();
  const [marginThreshold, setMarginThreshold] = useState<number>(15);
  
  // Calculate margin values for products without margin data
  const processedData = useMemo(() => {
    return data.map(product => {
      if (product.margin === undefined || product.margin_pct === undefined) {
        const cost = product.cost || (product.sales_amount * 0.7); // Default 30% margin if no cost data
        const margin = product.sales_amount - cost;
        const margin_pct = (margin / product.sales_amount) * 100;
        
        return {
          ...product,
          margin,
          margin_pct,
        };
      }
      return product;
    });
  }, [data]);
  
  // Calculate average margin
  const averageMargin = useMemo(() => {
    if (processedData.length === 0) return 0;
    return processedData.reduce((sum, product) => sum + (product.margin_pct || 0), 0) / processedData.length;
  }, [processedData]);
  
  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    return {
      type: 'scatter',
      x: processedData.map(p => p.sales_amount),
      y: processedData.map(p => p.margin_pct || 0),
      mode: 'markers',
      marker: {
        size: processedData.map(p => Math.min(Math.max(p.quantity / 100, 6), 16)),
        color: processedData.map(p => p.margin_pct || 0),
        colorscale: [
          [0, theme.colors.signalMagenta],
          [0.5, '#43cad0'], // Use hex color instead of theme.colors.teal
          [1, theme.colors.electricCyan],
        ],
      },
      text: processedData.map(p => `${p.product_name}<br>Sales: ${formatCurrency(p.sales_amount)}<br>Margin: ${formatPercentage(p.margin_pct || 0)}`),
      hoverinfo: 'text',
    };
  }, [processedData, theme]);
  
  // Prepare margin threshold line
  const thresholdLine = useMemo(() => {
    const salesMin = Math.min(...processedData.map(p => p.sales_amount));
    const salesMax = Math.max(...processedData.map(p => p.sales_amount));
    
    return {
      type: 'scatter',
      x: [salesMin, salesMax],
      y: [marginThreshold, marginThreshold],
      mode: 'lines',
      line: {
        color: theme.colors.cloudWhite,
        width: 2,
        dash: 'dash',
      },
      hoverinfo: 'none',
      showlegend: false,
    };
  }, [processedData, marginThreshold, theme]);
  
  // Prepare quadrant lines
  const quadrantLines = useMemo(() => {
    const salesMin = Math.min(...processedData.map(p => p.sales_amount));
    const salesMax = Math.max(...processedData.map(p => p.sales_amount));
    const salesMid = (salesMin + salesMax) / 2;
    
    return {
      type: 'scatter',
      x: [salesMid, salesMid],
      y: [0, Math.max(...processedData.map(p => p.margin_pct || 0))],
      mode: 'lines',
      line: {
        color: `${theme.colors.cloudWhite}40`,
        width: 1,
        dash: 'dot',
      },
      hoverinfo: 'none',
      showlegend: false,
    };
  }, [processedData, theme]);
  
  // Prepare histogram data for margin distribution
  const histogramData = useMemo(() => {
    return {
      type: 'histogram',
      x: processedData.map(p => p.margin_pct || 0),
      autobinx: true,
      marker: {
        color: theme.colors.electricCyan,
        line: {
          color: theme.colors.midnight,
          width: 1,
        },
      },
      hoverinfo: 'x+y',
    };
  }, [processedData, theme]);
  
  // Prepare average margin line for histogram
  const averageMarginLine = useMemo(() => {
    return {
      type: 'scatter',
      x: [averageMargin, averageMargin],
      y: [0, 100], // Will be scaled to match histogram
      mode: 'lines',
      line: {
        color: theme.colors.cloudWhite,
        width: 2,
      },
      hoverinfo: 'none',
      showlegend: false,
    };
  }, [averageMargin, theme]);
  
  // Prepare main scatter plot layout
  const scatterLayout = useMemo(() => {
    return generateChartLayout(theme, {
      height: height - 120, // Reserve space for histogram
      width,
      title: '',
      showlegend: false,
      xaxis: {
        title: 'Sales Amount ($)',
        zeroline: true,
        showgrid: true,
      },
      yaxis: {
        title: 'Margin (%)',
        zeroline: true,
        showgrid: true,
      },
      annotations: [
        {
          x: 0.25,
          y: marginThreshold + 5,
          xref: 'paper',
          yref: 'y',
          text: 'Margin Threshold',
          showarrow: false,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
            color: theme.colors.cloudWhite,
          },
        },
      ],
    });
  }, [theme, height, width, marginThreshold]);
  
  // Prepare histogram layout
  const histogramLayout = useMemo(() => {
    return generateChartLayout(theme, {
      height: 120,
      width,
      margin: { l: 50, r: 10, t: 0, b: 40 },
      bargap: 0.05,
      xaxis: {
        title: 'Margin (%)',
        zeroline: true,
        showgrid: true,
      },
      yaxis: {
        title: 'Count',
        zeroline: true,
        showgrid: true,
      },
    });
  }, [theme, width]);
  
  // Handle scatter plot click
  const handleScatterClick = (event: any) => {
    if (!onProductSelect || !event.points || !event.points[0]) return;
    
    const pointIndex = event.points[0].pointIndex;
    if (pointIndex !== undefined && pointIndex < processedData.length) {
      onProductSelect(processedData[pointIndex]);
    }
  };
  
  // Handle threshold change
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setMarginThreshold(value);
    }
  };
  
  // Calculate products above and below threshold
  const productsAboveThreshold = processedData.filter(p => (p.margin_pct || 0) >= marginThreshold).length;
  const productsBelowThreshold = processedData.length - productsAboveThreshold;
  const percentageAboveThreshold = (productsAboveThreshold / processedData.length) * 100;
  
  return (
    <Card 
      title={title}
      elevation="md"
      isLoading={loading}
    >
      <Grid cols={12} gap={16}>
        {/* Margin control panel */}
        <GridItem col={3}>
          <div style={{ 
            background: theme.colors.graphite, 
            borderRadius: '16px',
            padding: '16px',
            height: '100%',
          }}>
            <h3 style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '18px',
              marginTop: 0,
              marginBottom: '16px'
            }}>
              Margin Metrics
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: theme.colors.cloudWhite, margin: '4px 0' }}>Avg Margin</p>
              <p style={{ 
                color: theme.colors.electricCyan, 
                fontSize: '24px', 
                fontWeight: 600, 
                margin: '0' 
              }}>
                {formatPercentage(averageMargin)}
              </p>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: theme.colors.cloudWhite, margin: '4px 0' }}>
                Margin Threshold
              </p>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={marginThreshold}
                onChange={handleThresholdChange}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.colors.cloudWhite, fontSize: '12px' }}>0%</span>
                <span style={{ 
                  color: theme.colors.electricCyan, 
                  fontWeight: 600 
                }}>
                  {marginThreshold}%
                </span>
                <span style={{ color: theme.colors.cloudWhite, fontSize: '12px' }}>50%</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: theme.colors.cloudWhite, margin: '4px 0' }}>
                Products Above
              </p>
              <p style={{ 
                color: theme.colors.electricCyan, 
                fontSize: '18px', 
                fontWeight: 600, 
                margin: '0' 
              }}>
                {productsAboveThreshold} ({percentageAboveThreshold.toFixed(1)}%)
              </p>
            </div>
            
            <div>
              <p style={{ color: theme.colors.cloudWhite, margin: '4px 0' }}>
                Products Below
              </p>
              <p style={{ 
                color: theme.colors.signalMagenta, 
                fontSize: '18px', 
                fontWeight: 600, 
                margin: '0' 
              }}>
                {productsBelowThreshold} ({(100 - percentageAboveThreshold).toFixed(1)}%)
              </p>
            </div>
          </div>
        </GridItem>
        
        {/* Scatter plot */}
        <GridItem col={9}>
          <div>
            <Plot
              data={[scatterData, thresholdLine, quadrantLines]}
              layout={scatterLayout}
              config={{ responsive: true }}
              onClick={handleScatterClick}
            />
            <Plot
              data={[histogramData, averageMarginLine]}
              layout={histogramLayout}
              config={{ responsive: true }}
            />
          </div>
        </GridItem>
      </Grid>
    </Card>
  );
};

export default MarginAnalysisVisualizer; 