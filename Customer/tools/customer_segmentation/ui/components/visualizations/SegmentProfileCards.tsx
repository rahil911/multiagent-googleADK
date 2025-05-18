import React from 'react';
import { SegmentSummary } from '../../types';
import Card from 'ui-common/design-system/components/Card';

interface SegmentProfileCardsProps {
  segments: SegmentSummary[];
  selectedSegment?: string | number;
  onSelect?: (segment: string | number) => void;
}

const SegmentProfileCards: React.FC<SegmentProfileCardsProps> = ({ segments, selectedSegment, onSelect }) => {
  return (
    <div style={{ display: 'flex', overflowX: 'auto', gap: 20, padding: '8px 0 24px 0' }}>
      {segments.map(seg => (
        <Card
          key={seg.segment}
          style={{
            minWidth: 260,
            border: String(seg.segment) === String(selectedSegment) ? '2px solid #00e0ff' : '1px solid #eee',
            boxShadow: String(seg.segment) === String(selectedSegment) ? '0 0 8px #00e0ff44' : undefined,
            cursor: 'pointer',
            transition: 'box-shadow 0.2s, border 0.2s'
          }}
          onClick={() => onSelect?.(seg.segment)}
        >
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Segment {seg.segment}</div>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>Members: {seg.count}</div>
          <div style={{ fontSize: 14 }}>Avg Order Value: <b>${seg.avg_order_value.toFixed(2)}</b></div>
          <div style={{ fontSize: 14 }}>Avg Recency: <b>{seg.avg_recency.toFixed(1)} days</b></div>
          <div style={{ fontSize: 14 }}>Avg Spend: <b>${seg.avg_total_spend.toFixed(2)}</b></div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Types: {seg.customer_types.join(', ')}</div>
          <div style={{ fontSize: 13 }}>Regions: {seg.regions.join(', ')}</div>
        </Card>
      ))}
    </div>
  );
};

export default SegmentProfileCards; 