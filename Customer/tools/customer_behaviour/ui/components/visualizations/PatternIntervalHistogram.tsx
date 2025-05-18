import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { BehaviourPattern } from '../../types';

interface PatternIntervalHistogramProps {
  patterns: BehaviourPattern[];
  highlights?: { customer_id?: string };
  width?: number;
  height?: number;
}

const PatternIntervalHistogram: React.FC<PatternIntervalHistogramProps> = ({ patterns, highlights, width = 600, height = 300 }) => {
  const recencies = useMemo(() => patterns.map(p => p.recency), [patterns]);
  return (
    <Plot
      data={[{
        x: recencies,
        type: 'histogram',
        marker: {
          color: 'rgba(0,224,255,0.7)',
          line: { color: '#00e0ff', width: 1 }
        },
        name: 'Recency',
        opacity: 0.8,
      }]}
      layout={{
        width,
        height,
        title: 'Purchase Interval Histogram',
        xaxis: { title: 'Days Since Last Purchase', range: [0, Math.max(...recencies, 30)] },
        yaxis: { title: 'Customer Count' },
        paper_bgcolor: '#232a36',
        plot_bgcolor: '#232a36',
        font: { family: 'inherit', color: '#f7f9fb' },
        margin: { t: 40, l: 40, r: 40, b: 40 },
      }}
      config={{ responsive: true, displayModeBar: false }}
    />
  );
};

export default PatternIntervalHistogram; 