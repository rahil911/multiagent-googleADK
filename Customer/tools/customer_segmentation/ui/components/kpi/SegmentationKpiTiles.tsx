import React from 'react';
import { KPI, SegmentSummary } from '../../types';
import KpiTile from 'ui-common/design-system/components/KpiTile';
import { Grid } from 'ui-common/design-system/components/Grid';

interface SegmentationKpiTilesProps {
  kpis: KPI | null;
}

const formatSegment = (seg: SegmentSummary | undefined) =>
  seg ? `#${seg.segment} (${seg.count})` : '-';

const SegmentationKpiTiles: React.FC<SegmentationKpiTilesProps> = ({ kpis }) => {
  if (!kpis) return null;
  return (
    <Grid columns={4} gap={24} style={{ marginBottom: 24 }}>
      <KpiTile
        label="Total Segments"
        value={kpis.totalSegments}
        color="cyan"
      />
      <KpiTile
        label="Largest Segment"
        value={formatSegment(kpis.largestSegment)}
        color="magenta"
      />
      <KpiTile
        label="Most Valuable"
        value={formatSegment(kpis.mostValuableSegment)}
        color="navy"
      />
      <KpiTile
        label="Avg Segment Size"
        value={kpis.avgSegmentSize.toFixed(1)}
        color="cyan"
      />
    </Grid>
  );
};

export default SegmentationKpiTiles; 