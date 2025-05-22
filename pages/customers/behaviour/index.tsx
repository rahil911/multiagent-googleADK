import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic'; // Import dynamic
// Adjusted import paths from pages/customers/behaviour/index.tsx
import { ThemeProvider } from '../../../ui-common/design-system/theme'; 
import KpiTile from '../../../ui-common/design-system/components/KpiTile/KpiTile'; // Import KpiTile
import { Card } from '../../../ui-common/design-system/components/Card'; // Import Card

// Dynamically import chart components with SSR disabled
const PatternRadarChart = dynamic(() => import('../../../Customer/tools/customer_behaviour/ui/components/visualizations/PatternRadarChart'), { ssr: false });
const PatternIntervalHistogram = dynamic(() => import('../../../Customer/tools/customer_behaviour/ui/components/visualizations/PatternIntervalHistogram'), { ssr: false });
const CategoryTreemap = dynamic(() => import('../../../Customer/tools/customer_behaviour/ui/components/visualizations/CategoryTreemap'), { ssr: false });
const ChannelDonutChart = dynamic(() => import('../../../Customer/tools/customer_behaviour/ui/components/visualizations/ChannelDonutChart'), { ssr: false });

const CustomerBehaviourDashboardPage = () => {
  const [behaviourData, setBehaviourData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/customer-behaviour/data'); // This API path should still work
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.status === 'success' && data.patterns) {
          setBehaviourData(data);
        } else {
          throw new Error('Fetched data is not in the expected format.');
        }
      } catch (e: any) {
        setError(e.message);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpiMetrics = useMemo(() => {
    if (!behaviourData || !behaviourData.patterns || behaviourData.patterns.length === 0) {
      return {
        avgPurchaseInterval: 'N/A',
        avgOrderValue: 'N/A',
        avgCategoryDiversity: 'N/A',
        dominantChannelMix: 'N/A',
        highChurnRiskPercent: 'N/A',
      };
    }
    const patterns = behaviourData.patterns;
    const numPatterns = patterns.length;

    let totalRecencyForInterval = 0;
    let totalFrequencyForInterval = 0;
    patterns.forEach((p: any) => {
      if (p.frequency > 0 && typeof p.recency === 'number') {
        totalRecencyForInterval += p.recency;
        totalFrequencyForInterval += p.frequency;
      }
    });
    const avgPurchaseInterval = totalFrequencyForInterval > 0 
        ? (totalRecencyForInterval / totalFrequencyForInterval).toFixed(1) 
        : 'N/A';

    const avgOrderValue = (patterns.reduce((sum: number, p: any) => sum + (p.avg_order_value || 0), 0) / numPatterns).toFixed(2);
    const avgCategoryDiversity = (patterns.reduce((sum: number, p: any) => sum + (p.diversity || 0), 0) / numPatterns).toFixed(1);
    
    // Channel Mix: Placeholder as per-customer channel data isn't in `patterns`
    const dominantChannelMix = 'N/A'; 

    const highChurnRiskCount = patterns.filter((p: any) => p.churn_risk === 'high').length;
    const highChurnRiskPercent = ((highChurnRiskCount / numPatterns) * 100).toFixed(0);

    return {
      avgPurchaseInterval,
      avgOrderValue,
      avgCategoryDiversity,
      dominantChannelMix,
      highChurnRiskPercent,
    };
  }, [behaviourData]);

  // Common style for the flex container within cards that hold multiple charts/elements
  const innerFlexContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    alignItems: 'stretch', // Stretch items to fill height if in a row
  };

  // Style for individual chart wrappers, ensuring they are distinct if needed or blend in
  const chartWrapperStyle: React.CSSProperties = {
    padding: '0px', // Card will provide padding
    borderRadius: '8px',
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center',
    flexGrow: 1, // Allow chart wrappers to grow
  };

  const kpiContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px', // Gap between KPI tiles
    justifyContent: 'space-between', // Distribute tiles like in Churn dashboard
    marginBottom: '30px', // Space below KPI row
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0A0F1E', color: '#F9FAFB' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0A0F1E', color: 'red' }}>Error loading dashboard: {error}</div>;
  }

  if (!behaviourData || !behaviourData.patterns) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0A0F1E', color: '#F9FAFB' }}>No data available to display.</div>;
  }
  
  const patterns = behaviourData.patterns;

  return (
    <ThemeProvider>
      <div style={{ backgroundColor: '#0A0F1E', color: '#D1D5DB', padding: '25px 35px', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <header style={{ marginBottom: '25px'}}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#F9FAFB', margin: '0 0 5px 0' }}>Customer Behaviour Dashboard</h1>
          <p style={{fontSize: '0.875rem', color: '#9CA3AF', margin: 0}}>Insights into customer interaction patterns and preferences.</p>
        </header>

        <div style={kpiContainerStyle}>
          <KpiTile title="Avg. Purchase Interval" value={kpiMetrics.avgPurchaseInterval} unit="days" />
          <KpiTile title="Avg. Order Value" value={kpiMetrics.avgOrderValue} unit="$" />
          <KpiTile title="Avg. Category Diversity" value={kpiMetrics.avgCategoryDiversity} />
          <KpiTile title="Dominant Channel Mix" value={kpiMetrics.dominantChannelMix} /> {/* This will remain N/A */}
          <KpiTile title="High Churn Risk" value={kpiMetrics.highChurnRiskPercent} unit="%" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <Card title="Purchase Pattern Explorer" fullWidth elevation="lg">
            <div style={innerFlexContainerStyle}>
              <div style={{...chartWrapperStyle, flexBasis: 'calc(60% - 10px)', minHeight:'400px'}}>
                <PatternRadarChart patterns={patterns} width={undefined} height={380} />
              </div>
              <div style={{...chartWrapperStyle, flexBasis: 'calc(40% - 10px)', minHeight:'400px'}}>
                <PatternIntervalHistogram patterns={patterns} />
              </div>
            </div>
          </Card>

          <Card title="Product Preference Analyzer" fullWidth elevation="lg">
            <div style={{...chartWrapperStyle, width: '100%', minHeight:'480px'}}>
              <CategoryTreemap categories={patterns} width={undefined} height={460} />
            </div>
          </Card>

          <Card title="Channel Usage Visualizer" fullWidth elevation="lg">
             <div style={{...chartWrapperStyle, width: '100%', minHeight:'330px'}}>
                <div style={{maxWidth: '330px', margin: 'auto'}}>
                    <ChannelDonutChart channels={patterns} width={280} height={280} />
                </div>
            </div>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default CustomerBehaviourDashboardPage; 