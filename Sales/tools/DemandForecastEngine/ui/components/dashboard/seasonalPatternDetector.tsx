import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ReferenceLine, Area,
  BarChart, Bar, Cell
} from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter, SeasonalPattern } from '../../types';
import ChartWrapper from '../common/ChartWrapper';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { formatPercentage } from '../../utils/chartHelpers';

interface SeasonalPatternDetectorProps {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
  data?: SeasonalPattern;
}

const SeasonalPatternDetector: React.FC<SeasonalPatternDetectorProps> = ({
  horizon,
  metric,
  filters,
  data: externalData,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [seasonalPattern, setSeasonalPattern] = useState<SeasonalPattern | null>(null);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    if (externalData) {
      setSeasonalPattern(externalData);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchData = () => {
      // Generate mock data for the seasonal pattern
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Create seasonal indices for each month/period
      const seasonalIndices = months.map((month, index) => {
        // Create a sine wave pattern with some randomness
        const baseValue = Math.sin((index / 12) * Math.PI * 2);
        const seasonalIndex = 1 + baseValue * 0.35 + (Math.random() * 0.15 - 0.075);
        
        return {
          period: month,
          index: seasonalIndex,
          actual: seasonalIndex > 1.1,
        };
      });
      
      // Create heatmap data showing multiple years
      const heatmapRows = [];
      for (let year = 2019; year <= 2023; year++) {
        const yearData: {[key: string]: any} = { year };
        
        // For each month, add a normalized value
        months.forEach((month, index) => {
          // Apply the seasonal pattern with some year-to-year variation
          const basePattern = seasonalIndices[index].index;
          const yearVariation = 1 + ((year - 2019) * 0.03);
          const randomVariation = Math.random() * 0.2 - 0.1;
          const intensity = basePattern * yearVariation + randomVariation;
          
          yearData[month] = intensity;
        });
        
        heatmapRows.push(yearData);
      }
      
      // Calculate strength of seasonality pattern
      const maxIndex = Math.max(...seasonalIndices.map(d => d.index));
      const minIndex = Math.min(...seasonalIndices.map(d => d.index));
      const maxMonth = months[seasonalIndices.findIndex(d => d.index === maxIndex)];
      const minMonth = months[seasonalIndices.findIndex(d => d.index === minIndex)];
      
      setSeasonalPattern({
        strength: 0.75 + Math.random() * 0.2, // 75-95%
        peakSeason: maxMonth,
        lowSeason: minMonth,
        amplitude: maxIndex / minIndex,
      });
      
      setSeasonalData(seasonalIndices);
      setHeatmapData(heatmapRows);
      setLoading(false);
    };
    
    // Simulate API delay
    setTimeout(fetchData, 500);
  }, [horizon, metric, filters, externalData]);

  // Get color for heatmap cell based on value
  const getHeatmapColor = (value: number) => {
    if (value >= 1.2) return theme.colors.signalMagenta;
    if (value >= 1.1) return theme.colors.electricCyan;
    if (value >= 1.0) return "#3e7b97"; // blue-gray
    return theme.colors.midnight;
  };

  // Custom tooltip for line chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: theme.colors.midnight,
          padding: theme.spacing[3],
          border: `1px solid ${theme.colors.electricCyan}`,
          borderRadius: '8px',
          boxShadow: theme.shadows.md
        }}>
          <p style={{ 
            color: theme.colors.cloudWhite, 
            fontWeight: theme.typography.fontWeight.semiBold,
            margin: '0 0 8px 0'
          }}>
            {data.period}
          </p>
          <p style={{ 
            color: theme.colors.electricCyan,
            margin: '4px 0'
          }}>
            Seasonal Index: {data.index.toFixed(2)}
          </p>
          <p style={{ 
            color: theme.colors.cloudWhite,
            opacity: 0.7,
            margin: '4px 0',
            fontSize: theme.typography.fontSize.sm
          }}>
            {data.index > 1 
              ? `${((data.index - 1) * 100).toFixed(0)}% above average`
              : `${((1 - data.index) * 100).toFixed(0)}% below average`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Pattern strength indicator
  const PatternStrengthIndicator = ({ strength }: { strength: number }) => {
    const segments = 10;
    const filledSegments = Math.round(strength * segments);
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ flex: 1, display: 'flex' }}>
          {Array.from({ length: segments }).map((_, i) => (
            <div 
              key={i}
              style={{
                height: '8px',
                flex: 1,
                backgroundColor: i < filledSegments 
                  ? i < segments * 0.7 
                    ? theme.colors.electricCyan
                    : theme.colors.signalMagenta
                  : theme.colors.graphiteDark,
                marginRight: '2px',
                borderRadius: i === 0 ? '4px 0 0 4px' : i === segments - 1 ? '0 4px 4px 0' : '0'
              }}
            />
          ))}
        </div>
        <span style={{ 
          marginLeft: '12px',
          color: theme.colors.cloudWhite,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium
        }}>
          {formatPercentage(strength)}
        </span>
      </div>
    );
  };

  // Pattern metric card
  const MetricCard = ({ label, value }: { label: string, value: string | number }) => (
    <div style={{ 
      marginBottom: '12px',
      backgroundColor: theme.colors.midnight,
      padding: '12px',
      borderRadius: '8px'
    }}>
      <div style={{
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.cloudWhite,
        opacity: 0.7,
        marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.electricCyan
      }}>
        {value}
      </div>
    </div>
  );

  // Action to change granularity
  const actions = (
    <div>
      <select
        style={{
          backgroundColor: theme.colors.midnight,
          color: theme.colors.cloudWhite,
          padding: '4px 8px',
          borderRadius: '4px',
          border: `1px solid ${theme.colors.graphiteDark}`,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize.sm,
        }}
        defaultValue="monthly"
      >
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
      </select>
    </div>
  );

  return (
    <ChartWrapper
      title="Seasonal Pattern Detector"
      isLoading={loading}
      height={480}
      actions={actions}
    >
      <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
        {/* Main visualization area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Seasonal heatmap */}
          <div style={{ flex: 1, minHeight: '180px' }}>
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ 
                color: theme.colors.cloudWhite, 
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semiBold,
                margin: 0
              }}>
                Multi-Year Pattern
              </h3>
            </div>
            
            <div style={{ 
              width: '100%', 
              height: 'calc(100% - 30px)',
              display: 'grid',
              gridTemplateRows: `repeat(${heatmapData.length}, 1fr)`,
              gridTemplateColumns: `80px repeat(12, 1fr)`,
              gap: '1px',
              backgroundColor: theme.colors.graphiteDark,
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              {/* Header row with month names */}
              <div style={{ 
                backgroundColor: theme.colors.midnight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.colors.cloudWhite,
                fontWeight: theme.typography.fontWeight.semiBold,
                fontSize: theme.typography.fontSize.xs
              }}>
                Year
              </div>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                <div key={month} style={{ 
                  backgroundColor: theme.colors.midnight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.cloudWhite,
                  fontSize: theme.typography.fontSize.xs
                }}>
                  {month}
                </div>
              ))}
              
              {/* Data rows */}
              {heatmapData.map((yearData, yearIndex) => (
                <React.Fragment key={yearData.year}>
                  {/* Year label */}
                  <div style={{ 
                    backgroundColor: theme.colors.midnight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.cloudWhite,
                    fontWeight: theme.typography.fontWeight.medium,
                    fontSize: theme.typography.fontSize.xs
                  }}>
                    {yearData.year}
                  </div>
                  
                  {/* Month cells */}
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                    <div 
                      key={`${yearData.year}-${month}`}
                      style={{ 
                        backgroundColor: getHeatmapColor(yearData[month]),
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                      title={`${month} ${yearData.year}: ${formatPercentage(yearData[month] - 1)} vs average`}
                    >
                      {yearData[month] > 1.15 && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.cloudWhite,
                          fontWeight: theme.typography.fontWeight.bold
                        }}>
                          {formatPercentage(yearData[month] - 1)}
                        </div>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Seasonal index chart */}
          <div style={{ flex: 1, minHeight: '180px' }}>
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ 
                color: theme.colors.cloudWhite, 
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semiBold,
                margin: 0
              }}>
                Seasonal Index
              </h3>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={seasonalData}
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={`${theme.colors.graphiteDark}33`} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: theme.colors.cloudWhite }}
                  stroke={theme.colors.cloudWhite}
                />
                <YAxis 
                  domain={[0.6, 1.4]}
                  tickFormatter={(value) => value.toFixed(1)}
                  tick={{ fill: theme.colors.cloudWhite }}
                  stroke={theme.colors.cloudWhite}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Average line */}
                <ReferenceLine 
                  y={1} 
                  label={{ 
                    value: 'Average', 
                    position: 'right',
                    fill: theme.colors.cloudWhite
                  }} 
                  stroke={theme.colors.cloudWhite}
                  strokeDasharray="3 3"
                />
                
                {/* Seasonal pattern line */}
                <Line
                  type="monotone"
                  dataKey="index"
                  stroke={theme.colors.electricCyan}
                  strokeWidth={3}
                  dot={{ fill: theme.colors.electricCyan, r: 4 }}
                  activeDot={{ fill: theme.colors.electricCyan, r: 6 }}
                />
                
                {/* Area under curve */}
                <Area
                  type="monotone"
                  dataKey="index"
                  stroke="none"
                  fill={theme.colors.electricCyan}
                  fillOpacity={0.1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Metrics panel */}
        <div style={{ width: '220px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              color: theme.colors.cloudWhite, 
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.semiBold,
              marginBottom: '12px'
            }}>
              Seasonal Patterns
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                color: theme.colors.cloudWhite, 
                fontSize: theme.typography.fontSize.sm,
                marginBottom: '4px'
              }}>
                Pattern Strength
              </div>
              {seasonalPattern && <PatternStrengthIndicator strength={seasonalPattern.strength} />}
            </div>
            
            {seasonalPattern && (
              <>
                <MetricCard label="Peak Season" value={seasonalPattern.peakSeason} />
                <MetricCard label="Low Season" value={seasonalPattern.lowSeason} />
                <MetricCard 
                  label="Amplitude" 
                  value={`${seasonalPattern.amplitude.toFixed(1)}x`} 
                />
              </>
            )}
          </div>
          
          <div style={{
            backgroundColor: theme.colors.midnight,
            padding: '12px',
            borderRadius: '8px'
          }}>
            <div style={{ 
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.cloudWhite,
              marginBottom: '8px'
            }}>
              Apply to Forecast
            </div>
            
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.cloudWhite,
                opacity: 0.8
              }}>
                Include Seasonality
              </span>
              <input 
                type="checkbox" 
                defaultChecked={true}
                style={{ accentColor: theme.colors.electricCyan, width: '16px', height: '16px' }}
              />
            </div>
            
            <div>
              <div style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.cloudWhite,
                opacity: 0.8,
                marginBottom: '4px'
              }}>
                Seasonal Strength: {seasonalPattern ? formatPercentage(seasonalPattern.strength) : '0%'}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={seasonalPattern ? Math.round(seasonalPattern.strength * 100) : 0}
                style={{ width: '100%', accentColor: theme.colors.electricCyan }}
              />
            </div>
          </div>
        </div>
      </div>
    </ChartWrapper>
  );
};

export default SeasonalPatternDetector;