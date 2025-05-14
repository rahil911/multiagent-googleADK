import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Product, PriceBandInfo } from '../../types';
import { formatCurrency, formatWithCommas } from '../../utils/formatters';
import { generateChartLayout } from '../../utils/chartHelpers';

// Import Plotly dynamically with SSR disabled
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PriceBandDistributionProps {
  data: Product[];
  priceBands?: string[];
  distribution?: Record<string, PriceBandInfo>;
  loading?: boolean;
  title?: string;
  onBandSelect?: (band: string) => void;
  height?: number;
  width?: number;
}

/**
 * Price Band Distribution Visualization
 * Shows product distribution across price bands
 */
export const PriceBandDistribution: React.FC<PriceBandDistributionProps> = ({
  data,
  priceBands,
  distribution,
  loading = false,
  title = 'Price Band Distribution',
  onBandSelect,
  height = 460,
  width = 620,
}) => {
  const theme = useTheme();
  
  // Generate price bands from data if not provided
  const generatedPriceBands = useMemo(() => {
    if (priceBands && distribution) return { priceBands, distribution };
    
    // Calculate average price for each product
    const productsWithPrice = data.map(p => ({
      ...p,
      avg_price: p.avg_price || (p.sales_amount / p.quantity)
    }));
    
    // Define price bands
    const bands = [
      '$0-10',
      '$10-20',
      '$20-50',
      '$50-100',
      '$100+'
    ];
    
    // Map products to bands
    const bandDistribution: Record<string, PriceBandInfo> = {};
    
    bands.forEach(band => {
      let min = 0;
      let max = Infinity;
      
      if (band === '$0-10') { min = 0; max = 10; }
      else if (band === '$10-20') { min = 10; max = 20; }
      else if (band === '$20-50') { min = 20; max = 50; }
      else if (band === '$50-100') { min = 50; max = 100; }
      else if (band === '$100+') { min = 100; max = Infinity; }
      
      const productsInBand = productsWithPrice.filter(p => 
        p.avg_price >= min && p.avg_price < max
      );
      
      bandDistribution[band] = {
        count: productsInBand.length,
        total_sales: productsInBand.reduce((sum, p) => sum + p.sales_amount, 0),
        avg_price: productsInBand.length > 0 
          ? productsInBand.reduce((sum, p) => sum + p.avg_price, 0) / productsInBand.length
          : 0
      };
    });
    
    return { priceBands: bands, distribution: bandDistribution };
  }, [data, priceBands, distribution]);
  
  // Prepare donut chart data
  const donutData = useMemo(() => {
    const { priceBands, distribution } = generatedPriceBands;
    
    return [{
      type: 'pie',
      hole: 0.6,
      values: priceBands.map(band => distribution[band].count),
      labels: priceBands,
      textinfo: 'label+percent',
      textposition: 'outside',
      automargin: true,
      marker: {
        colors: [
          theme.colors.electricCyan, // $0-10
          '#5fd4d6', // $10-20
          '#43cad0', // $20-50
          '#aa45dd', // $50-100
          theme.colors.signalMagenta, // $100+
        ],
      },
      hoverinfo: 'label+value+percent',
      hovertemplate: '%{label}: %{value} products (%{percent})<extra></extra>',
    }];
  }, [generatedPriceBands, theme]);
  
  // Prepare distribution curve data
  const curveData = useMemo(() => {
    // Get all products with price
    const productsWithPrice = data
      .filter(p => p.quantity > 0)
      .map(p => ({
        ...p,
        avg_price: p.avg_price || (p.sales_amount / p.quantity)
      }))
      .sort((a, b) => a.avg_price - b.avg_price);
    
    // Generate distribution curve
    const prices = productsWithPrice.map(p => p.avg_price);
    
    // Count products in each price range (bin)
    const maxPrice = Math.min(Math.max(...prices), 200); // Cap at $200 for visualization
    const binSize = 5;
    const bins: number[] = [];
    const counts: number[] = [];
    
    for (let bin = 0; bin <= maxPrice; bin += binSize) {
      const count = prices.filter(price => price >= bin && price < bin + binSize).length;
      bins.push(bin);
      counts.push(count);
    }
    
    return [{
      type: 'scatter',
      x: bins,
      y: counts,
      mode: 'lines',
      fill: 'tozeroy',
      line: {
        color: theme.colors.electricCyan,
        width: 3,
      },
      fillcolor: `${theme.colors.electricCyan}30`,
      hoverinfo: 'x+y',
      hovertemplate: 'Price: $%{x}<br>Products: %{y}<extra></extra>',
    }];
  }, [data, theme]);
  
  // Prepare band marker lines for distribution curve
  const bandMarkers = useMemo(() => {
    return [{
      type: 'scatter',
      x: [10, 10],
      y: [0, 20],
      mode: 'lines',
      line: { color: '#5fd4d6', width: 1, dash: 'dash' },
      hoverinfo: 'none',
      showlegend: false,
    }, {
      type: 'scatter',
      x: [20, 20],
      y: [0, 20],
      mode: 'lines',
      line: { color: '#43cad0', width: 1, dash: 'dash' },
      hoverinfo: 'none',
      showlegend: false,
    }, {
      type: 'scatter',
      x: [50, 50],
      y: [0, 20],
      mode: 'lines',
      line: { color: '#aa45dd', width: 1, dash: 'dash' },
      hoverinfo: 'none',
      showlegend: false,
    }, {
      type: 'scatter',
      x: [100, 100],
      y: [0, 20],
      mode: 'lines',
      line: { color: theme.colors.signalMagenta, width: 1, dash: 'dash' },
      hoverinfo: 'none',
      showlegend: false,
    }];
  }, [theme]);
  
  // Generate layout for donut chart
  const donutLayout = useMemo(() => {
    return generateChartLayout(theme, {
      height: 320,
      width: width,
      margin: { t: 0, b: 0, l: 0, r: 0 },
      showlegend: false,
    });
  }, [theme, width]);
  
  // Generate layout for distribution curve
  const curveLayout = useMemo(() => {
    return generateChartLayout(theme, {
      height: 180,
      width: width,
      margin: { t: 0, b: 40, l: 50, r: 10 },
      showlegend: false,
      xaxis: {
        title: 'Price ($)',
        zeroline: true,
        showgrid: true,
      },
      yaxis: {
        title: 'Product Count',
        zeroline: true,
        showgrid: true,
      },
    });
  }, [theme, width]);
  
  // Handle donut chart click
  const handleDonutClick = (event: any) => {
    if (!onBandSelect || !event.points || !event.points[0]) return;
    
    const bandIndex = event.points[0].pointIndex;
    if (bandIndex !== undefined && bandIndex < generatedPriceBands.priceBands.length) {
      onBandSelect(generatedPriceBands.priceBands[bandIndex]);
    }
  };
  
  // Find dominant price band
  const dominantBand = useMemo(() => {
    const { priceBands, distribution } = generatedPriceBands;
    let maxCount = 0;
    let dominant = '';
    
    priceBands.forEach(band => {
      if (distribution[band].count > maxCount) {
        maxCount = distribution[band].count;
        dominant = band;
      }
    });
    
    return dominant;
  }, [generatedPriceBands]);
  
  // Generate band metric cards
  const bandCards = useMemo(() => {
    const { priceBands, distribution } = generatedPriceBands;
    
    // Band colors
    const colors = {
      '$0-10': theme.colors.electricCyan,
      '$10-20': '#5fd4d6',
      '$20-50': '#43cad0',
      '$50-100': '#aa45dd',
      '$100+': theme.colors.signalMagenta,
    };
    
    return priceBands.map(band => {
      const info = distribution[band];
      const color = colors[band as keyof typeof colors] || theme.colors.electricCyan;
      
      return (
        <div
          key={band}
          style={{
            background: `${color}20`,
            border: `1px solid ${color}`,
            borderRadius: '12px',
            padding: '12px',
            width: '100%',
            cursor: 'pointer',
          }}
          onClick={() => onBandSelect && onBandSelect(band)}
        >
          <div style={{ 
            color: theme.colors.cloudWhite, 
            fontWeight: 600, 
            marginBottom: '4px' 
          }}>
            {band}
          </div>
          <div style={{ 
            color: color, 
            fontSize: '18px', 
            fontWeight: 600 
          }}>
            {formatWithCommas(info.count)} products
          </div>
          <div style={{ 
            color: theme.colors.cloudWhite, 
            fontSize: '12px' 
          }}>
            Avg: {formatCurrency(info.avg_price)}
          </div>
        </div>
      );
    });
  }, [generatedPriceBands, theme, onBandSelect]);
  
  return (
    <Card 
      title={title}
      elevation="md"
      isLoading={loading}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Donut chart */}
        <div style={{ position: 'relative' }}>
          <Plot
            data={donutData}
            layout={donutLayout}
            config={{ responsive: true }}
            onClick={handleDonutClick}
          />
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{ 
              color: theme.colors.cloudWhite, 
              fontSize: '14px' 
            }}>
              Dominant Band
            </div>
            <div style={{ 
              color: theme.colors.electricCyan, 
              fontSize: '20px', 
              fontWeight: 600 
            }}>
              {dominantBand}
            </div>
          </div>
        </div>
        
        {/* Distribution curve */}
        <Plot
          data={[...curveData, ...bandMarkers]}
          layout={curveLayout}
          config={{ responsive: true }}
        />
        
        {/* Band metric cards */}
        <Grid cols={5} gap={8} style={{ marginTop: '16px', width: '100%' }}>
          {bandCards.map((card, index) => (
            <GridItem key={index}>
              {card}
            </GridItem>
          ))}
        </Grid>
      </div>
    </Card>
  );
};

export default PriceBandDistribution; 