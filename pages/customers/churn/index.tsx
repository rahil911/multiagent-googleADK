import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ChurnKpiTiles from '../../../Customer/tools/churn_prediction/ui/components/kpi/ChurnKpiTiles';
import { Card } from '../../../ui-common/design-system/components/Card';
import { Grid } from '../../../ui-common/design-system/components/Grid';
import ProbabilityHistogram from '../../../Customer/tools/churn_prediction/ui/components/visualizations/ProbabilityHistogram';
import FeatureImportance from '../../../Customer/tools/churn_prediction/ui/components/visualizations/FeatureImportance';
import CustomerTable from '../../../Customer/tools/churn_prediction/ui/components/CustomerTable';
import TemporalRiskPattern from '../../../Customer/tools/churn_prediction/ui/components/visualizations/TemporalRiskPattern';
import SegmentMatrix from '../../../Customer/tools/churn_prediction/ui/components/visualizations/SegmentMatrix';
import InsightsDrawer from '../../../Customer/tools/churn_prediction/ui/components/InsightsDrawer';
import RetentionStrategies from '../../../Customer/tools/churn_prediction/ui/components/RetentionStrategies';

const ChurnRiskPyramid = dynamic(() => import('../../../Customer/tools/churn_prediction/ui/components/visualizations/ChurnRiskPyramid'), { ssr: false });

const fetchChurnData = async () => {
  const res = await fetch('/api/churn-prediction/data');
  return res.json();
};

export default function ChurnDashboardPage() {
  const [data, setData] = useState<any>({ status: 'loading' });
  const [binCount, setBinCount] = useState(30);
  const [sortBy, setSortBy] = useState<'importance' | 'alphabetical'>('importance');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchChurnData().then(setData).catch(() => setData({ status: 'error' }));
  }, []);

  // Compute KPIs from data
  const computeKPIs = (customers = []) => {
    if (!customers.length) return {
      overallRisk: 0, highRiskCount: 0, modelConfidence: 0.85, topFactor: 'Recency', riskTransition: 0
    };
    const overallRisk = Math.round(100 * customers.filter((c: any) => c.risk_level !== 'Low').length / customers.length);
    const highRiskCount = customers.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High').length;
    return {
      overallRisk,
      highRiskCount,
      modelConfidence: 0.85,
      topFactor: 'Recency',
      riskTransition: 0
    };
  };
  const kpis = computeKPIs(data.customers || []);

  if (data.status === 'loading') return <div style={{ color: '#00e0ff', padding: 40 }}>Loading...</div>;
  if (data.status === 'error') return <div style={{ color: '#e930ff', padding: 40 }}>Failed to load churn dashboard data.</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#181e2a', color: '#f7f9fb', fontFamily: 'Inter, sans-serif', padding: 0 }}>
      <div style={{ padding: '32px 40px 0 40px', borderBottom: '2px solid #232a36', background: '#232a36' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Churn Prediction Dashboard</h1>
        <div style={{ color: '#b0b8c9', marginTop: 4, marginBottom: 16 }}>AI-powered churn risk analytics and retention strategy</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 32, padding: '32px 40px' }}>
        <div style={{ flex: 3, minWidth: 0 }}>
          <ChurnKpiTiles kpis={kpis} />
          <Grid columns={2} gap={32} style={{ marginTop: 32 }}>
            <ChurnRiskPyramid customers={data.customers || []} data={data.customers || []} />
            <ProbabilityHistogram
              probabilities={data.probabilities || []}
              thresholds={[0.3, 0.6, 0.8]}
              binCount={binCount}
              onBinCountChange={setBinCount}
            />
          </Grid>
          <Grid columns={2} gap={32} style={{ marginTop: 32 }}>
            <FeatureImportance
              features={data.feature_importance || []}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
            <SegmentMatrix segmentMatrix={data.segment_matrix || []} />
          </Grid>
          <TemporalRiskPattern riskTimeSeries={data.risk_time_series || []} />
          <CustomerTable customers={data.customers || []} page={page} onPageChange={setPage} />
        </div>
        <div style={{ flex: 1, minWidth: 340, maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <InsightsDrawer insights={data.insights || []} />
          <RetentionStrategies strategies={data.retention_strategies || []} />
        </div>
      </div>
    </div>
  );
} 