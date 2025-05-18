import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BehaviourKpiTiles from '../ui/components/kpi/BehaviourKpiTiles';
import BehaviourFilters from '../ui/components/controls/BehaviourFilters';
import PatternRadarChart from '../ui/components/visualizations/PatternRadarChart';
import PatternIntervalHistogram from '../ui/components/visualizations/PatternIntervalHistogram';
import CategoryTreemap from '../ui/components/visualizations/CategoryTreemap';
import ChannelDonutChart from '../ui/components/visualizations/ChannelDonutChart';
import { RootState } from 'store';
import {
  setPatterns,
  setCategories,
  setChannels,
  setKPIs,
  setFilters,
  setHighlights,
  setLoading,
  setError
} from '../ui/state/customerBehaviourSlice';

const CustomerBehaviourDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const {
    patterns,
    categories,
    channels,
    kpis,
    filters,
    highlights,
    loading,
    error
  } = useSelector((state: RootState) => state.customerBehaviour);

  // Compute filter options
  const categoryOptions = categories.map(c => c.category);
  const channelOptions = channels.map(c => c.channel);
  const churnRiskOptions = ['low', 'medium', 'high'] as const;

  // Filtered data
  const filteredPatterns = patterns.filter(p => {
    if (filters.category) return true; // category is not per-pattern here
    if (filters.channel) return true; // channel is not per-pattern here
    if (filters.churnRisk && p.churn_risk !== filters.churnRisk) return false;
    return true;
  });
  const filteredCategories = filters.category ? categories.filter(c => c.category === filters.category) : categories;
  const filteredChannels = filters.channel ? channels.filter(c => c.channel === filters.channel) : channels;

  // Fetch data
  useEffect(() => {
    dispatch(setLoading(true));
    fetch('/api/customer-behaviour/data')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          dispatch(setPatterns(data.patterns));
          dispatch(setCategories(data.categories));
          dispatch(setChannels(data.channels));
          dispatch(setKPIs(data.kpis));
          dispatch(setError(null));
        } else {
          dispatch(setError(data.message || 'Unknown error'));
        }
      })
      .catch(e => dispatch(setError(e.message)))
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch]);

  // Handlers
  const handleFilterChange = useCallback(val => {
    dispatch(setFilters(val));
  }, [dispatch]);

  const handleHighlight = useCallback(val => {
    dispatch(setHighlights(val));
  }, [dispatch]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Customer Behaviour</h1>
      <div style={{ color: '#888', marginBottom: 24 }}>Explore customer behaviour patterns, preferences, and engagement. Use filters to focus on specific categories, channels, or churn risk.</div>
      <BehaviourKpiTiles kpis={kpis} />
      <BehaviourFilters
        categories={categoryOptions}
        channels={channelOptions}
        churnRisks={churnRiskOptions}
        value={filters}
        onChange={handleFilterChange}
      />
      <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
        <PatternRadarChart patterns={filteredPatterns} highlights={highlights} width={400} height={400} />
        <PatternIntervalHistogram patterns={filteredPatterns} highlights={highlights} width={400} height={300} />
      </div>
      <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
        <CategoryTreemap categories={filteredCategories} highlights={highlights} width={400} height={400} />
        <ChannelDonutChart channels={filteredChannels} highlights={highlights} width={400} height={400} />
      </div>
      {error && <div style={{ color: 'red', marginTop: 24 }}>{error}</div>}
    </div>
  );
};

export { CustomerBehaviourDashboard };
export default CustomerBehaviourDashboard; 