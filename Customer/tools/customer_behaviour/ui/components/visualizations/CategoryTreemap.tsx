import React from 'react';
import Plot from 'react-plotly.js';
import { CategoryAffinity } from '../../types';

interface CategoryTreemapProps {
  categories: CategoryAffinity[];
  highlights?: { category?: string };
  width?: number;
  height?: number;
}

const CategoryTreemap: React.FC<CategoryTreemapProps> = ({ categories, highlights, width = 600, height = 400 }) => {
  const labels = categories.map(c => c.category);
  const values = categories.map(c => c.spend);
  const colors = categories.map((c, i) => highlights?.category === c.category ? '#e930ff' : '#00e0ff');
  return (
    <Plot
      data={[{
        type: 'treemap',
        labels,
        parents: labels.map(() => ''),
        values,
        marker: { colors },
        textinfo: 'label+value+percent entry',
        hoverinfo: 'label+value+percent entry',
        outsidetextfont: { size: 14, color: '#f7f9fb' },
        branchvalues: 'total',
      }]}
      layout={{
        width,
        height,
        title: 'Product Category Affinity',
        paper_bgcolor: '#232a36',
        plot_bgcolor: '#232a36',
        font: { family: 'inherit', color: '#f7f9fb' },
        margin: { t: 40, l: 20, r: 20, b: 20 },
      }}
      config={{ responsive: true, displayModeBar: false }}
    />
  );
};

export default CategoryTreemap; 