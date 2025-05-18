import React from 'react';
import { ChurnCustomer } from '../../../types';

interface ChurnRiskPyramidProps {
  customers: ChurnCustomer[];
  data: any[];
  width?: number;
  height?: number;
}

const riskLevels = [
  { key: 'Very High', color: '#e930ff' },
  { key: 'High', color: '#aa45dd' },
  { key: 'Medium', color: '#5fd4d6' },
  { key: 'Low', color: '#00e0ff' },
];

const levelHeight = 80;
const levelGap = 4;

const ChurnRiskPyramid: React.FC<ChurnRiskPyramidProps> = (props) => {
  // Always use passed width/height or fallback
  const width = props.width ?? 520;
  const height = props.height ?? 400;
  const customers = props.customers || props.data || [];
  console.log('ChurnRiskPyramid customers:', customers, 'width:', width, 'height:', height);

  // Count customers per risk level
  const counts = riskLevels.map(l => customers.filter(c => c.risk_level === l.key).length);
  const total = customers.length || 1;
  const percentages = counts.map(c => (c / total) * 100);

  // Calculate max width for base
  const baseWidth = width * 0.9;
  const minWidth = width * 0.25;

  // Calculate widths for each level (proportional to count, but min width enforced)
  const widths = counts.map((c, i) => {
    if (total === 0) return minWidth;
    const w = minWidth + (baseWidth - minWidth) * (c / Math.max(...counts, 1));
    return Math.max(minWidth, w);
  });

  return (
    <div style={{ width, height, minWidth: 320, minHeight: 240, background: '#232a36', borderRadius: 16, padding: 24, position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <h3 style={{ margin: 0, marginBottom: 16, color: '#f7f9fb', fontWeight: 700, fontSize: 20 }}>Churn Risk Pyramid</h3>
      <svg width={width} height={height - 40}>
        {riskLevels.map((level, i) => {
          const y = i * (levelHeight + levelGap);
          const w = widths[i];
          const x = (width - w) / 2;
          return (
            <g key={level.key}>
              <rect
                x={x}
                y={y}
                width={w}
                height={levelHeight}
                rx={12}
                fill={level.color}
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}
              />
              <text
                x={width / 2}
                y={y + levelHeight / 2 - 8}
                textAnchor="middle"
                fill="#f7f9fb"
                fontSize={18}
                fontWeight={700}
              >
                {level.key}
              </text>
              <text
                x={width / 2}
                y={y + levelHeight / 2 + 18}
                textAnchor="middle"
                fill="#f7f9fb"
                fontSize={14}
                fontWeight={500}
              >
                {counts[i]} ({percentages[i].toFixed(1)}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ChurnRiskPyramid; 