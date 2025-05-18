import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { ScatterDatum } from '../../types';

interface SegmentDistributionMapProps {
  scatterData: ScatterDatum[];
  highlights?: { segment?: string | number };
  onPointClick?: (customer_id: string) => void;
  width?: number;
  height?: number;
  colorScale?: string[];
}

const defaultColors = [
  '#00e0ff', '#e930ff', '#0a1224', '#ffb300', '#00c853', '#d50000', '#3949ab', '#f50057', '#00bcd4', '#ff6d00'
];

const SegmentDistributionMap: React.FC<SegmentDistributionMapProps> = ({
  scatterData,
  highlights,
  onPointClick,
  width = 700,
  height = 400,
  colorScale = defaultColors
}) => {
  // Group by segment
  const segmentGroups = useMemo(() => {
    const groups: Record<string, ScatterDatum[]> = {};
    scatterData.forEach(d => {
      const key = String(d.segment);
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }, [scatterData]);

  const data = Object.entries(segmentGroups).map(([segment, points], i) => ({
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    text: points.map(p => `ID: ${p.customer_id}`),
    mode: 'markers',
    type: 'scatter',
    name: `Segment ${segment}`,
    marker: {
      color: colorScale[i % colorScale.length],
      size: highlights?.segment && String(highlights.segment) === segment ? 18 : 12,
      opacity: highlights?.segment && String(highlights.segment) === segment ? 1 : 0.7,
      line: highlights?.segment && String(highlights.segment) === segment ? { width: 3, color: '#fff' } : undefined
    },
    customdata: points.map(p => p.customer_id)
  }));

  return (
    <Plot
      data={data}
      layout={{
        width,
        height,
        title: 'Customer Segment Distribution',
        xaxis: { title: 'Recency (days since last purchase)' },
        yaxis: { title: 'Transaction Count' },
        legend: { orientation: 'h', y: -0.2 },
        plot_bgcolor: '#fff',
        paper_bgcolor: '#fff',
        margin: { t: 40, l: 60, r: 20, b: 60 },
        font: { family: 'inherit', color: '#0a1224' }
      }}
      config={{ responsive: true, displayModeBar: false }}
      onClick={evt => {
        if (onPointClick && evt.points && evt.points[0]) {
          const customer_id = evt.points[0].customdata;
          onPointClick(customer_id);
        }
      }}
    />
  );
};

export default SegmentDistributionMap; 