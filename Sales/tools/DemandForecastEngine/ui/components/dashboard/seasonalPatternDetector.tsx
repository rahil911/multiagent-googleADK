import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ReferenceLine, Area,
  BarChart, Bar, Cell
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { ForecastHorizon, ForecastMetric, DimensionFilter, SeasonalPattern } from '../../types';
import ChartWrapper from '../common/ChartWrapper';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/chartHelpers';
import SeasonalHeatmap from '../visualizations/SeasonalHeatmap';
// Import the API directly for standalone use
import demandForecastAPI from '../../api/demandForecastApi';
import { selectSeasonalPattern } from '../../state/demandForecastSlice';

interface SeasonalPatternDetectorProps {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
  data?: SeasonalPattern;
}

const SeasonalPatternDetector: React.FC<SeasonalPatternDetectorProps> = ({
  horizon = 'month',
  metric = 'quantity',
  filters = {},
  data: externalData,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const reduxData = useSelector(selectSeasonalPattern);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [seasonalPattern, setSeasonalPattern] = useState<SeasonalPattern | null>(null);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'monthly' | 'quarterly' | 'weekly'>('monthly');

  useEffect(() => {
    // First priority: Use data passed directly as props
    if (externalData) {
      console.log("Using external prop data for Seasonal Pattern Detector");
      setSeasonalPattern(externalData);
      generateVisualizationData(externalData);
      return;
    }
    
    // Second priority: Use data from Redux store if available
    if (reduxData && reduxData.pattern) {
      console.log("Using Redux data for Seasonal Pattern Detector", reduxData.pattern);
      setSeasonalPattern(reduxData.pattern);
      generateVisualizationData(reduxData.pattern);
      return;
    }
    
    // Third priority: Fetch data directly with API call as fallback
    setLoading(true);
    console.log("No redux or prop data available, fetching from API directly");
    
    const fetchData = async () => {
      try {
        // Use the actual API function that generates mock data
        const patterns = await demandForecastAPI.fetchSeasonalPatterns(
          horizon,
          metric,
          filters
        );

        // If we got proper data back, use it
        if (patterns) {
          console.log("Successfully loaded seasonal pattern data:", patterns);
          setSeasonalPattern(patterns);
          generateVisualizationData(patterns);
        } else {
          console.error("No data returned from API");
          generateFallbackData();
        }
      } catch (error) {
        console.error("Error fetching seasonal pattern data:", error);
        generateFallbackData();
      }
    };
    
    fetchData();
  }, [horizon, metric, filters, externalData, reduxData]);

  // Function to generate the visualization data from a pattern object
  const generateVisualizationData = (pattern: SeasonalPattern) => {
    // Generate seasonal data from the pattern
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const seasonalIndices = months.map((month, index) => {
      // Create a sine wave pattern with amplitude based on pattern strength
      const baseValue = Math.sin((index / 12) * Math.PI * 2);
      const seasonalIndex = 1 + baseValue * pattern.strength * 0.5;
      
      return {
        period: month,
        index: seasonalIndex,
        actual: seasonalIndex > 1.1,
      };
    });
    
    // Create heatmap data
    const heatmapRows = [];
    for (let year = 2019; year <= 2023; year++) {
      const yearData: {[key: string]: any} = { year };
      
      // For each month, add a normalized value
      months.forEach((month, index) => {
        const basePattern = seasonalIndices[index].index;
        const yearVariation = 1 + ((year - 2019) * 0.03);
        const randomVariation = Math.random() * 0.2 - 0.1;
        const intensity = basePattern * yearVariation + randomVariation;
        
        yearData[month] = intensity;
      });
      
      heatmapRows.push(yearData);
    }
    
    setSeasonalData(seasonalIndices);
    setHeatmapData(heatmapRows);
    setLoading(false);
  };
  
  // Original implementation as fallback
  const generateFallbackData = () => {
    console.log("Generating fallback mock data for Seasonal Pattern Detector");
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
    
    const pattern = {
      strength: 0.75 + Math.random() * 0.2, // 75-95%
      peakSeason: maxMonth,
      lowSeason: minMonth,
      amplitude: maxIndex / minIndex,
    };
    
    setSeasonalPattern(pattern);
    setSeasonalData(seasonalIndices);
    setHeatmapData(heatmapRows);
    setLoading(false);
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
            margin: '4px 0',
            fontSize: theme.typography.fontSize.sm
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
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
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
      backgroundColor: theme.colors.graphite,
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
        fontSize: theme.typography.fontSize.xl,
        color: theme.colors.electricCyan,
        fontWeight: theme.typography.fontWeight.semiBold
      }}>
        {value}
      </div>
    </div>
  );

  // Button styles for view type selector
  const buttonStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: '24px',
    backgroundColor: theme.colors.electricCyan,
    color: theme.colors.midnight,
    border: 'none',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    margin: '0 4px',
    transition: 'all 0.2s ease'
  });

  return (
    <ChartWrapper
      title="Seasonal Pattern Detector"
      isLoading={loading}
      height={480}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
        {/* Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.medium
            }}>
              {seasonalPattern && `Pattern Strength: ${formatPercentage(seasonalPattern.strength)}`}
            </div>
            
            {seasonalPattern && (
              <PatternStrengthIndicator strength={seasonalPattern.strength} />
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              style={buttonStyle(true)}
              onClick={() => setViewType('monthly')}
            >
              Monthly View
            </button>
            <button 
              style={buttonStyle(true)}
              onClick={() => setViewType('quarterly')}
            >
              Quarterly View
            </button>
            <button 
              style={buttonStyle(true)}
              onClick={() => setViewType('weekly')}
            >
              Weekly View
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flex: 1, gap: '16px' }}>
          {/* Main visualization area */}
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Seasonal index chart */}
            <div style={{ flex: 1 }}>
              <div style={{ height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={seasonalData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={`${theme.colors.graphiteDark}33`} />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fill: theme.colors.cloudWhite }}
                      stroke={theme.colors.cloudWhite}
                    />
                    <YAxis 
                      tickFormatter={(value) => value.toFixed(2)}
                      tick={{ fill: theme.colors.cloudWhite }}
                      stroke={theme.colors.cloudWhite}
                      domain={[0.6, 1.4]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference line for baseline (index = 1) */}
                    <ReferenceLine 
                      y={1} 
                      stroke={theme.colors.cloudWhite}
                      strokeDasharray="5 5"
                    />
                    
                    {/* Seasonal index line */}
                    <Line
                      type="monotone"
                      dataKey="index"
                      stroke={theme.colors.electricCyan}
                      strokeWidth={3}
                      dot={{ r: 5, fill: theme.colors.electricCyan }}
                      activeDot={{ r: 7, fill: theme.colors.electricCyan }}
                    />
                    
                    {/* Area under the curve for better visualization */}
                    <Area
                      type="monotone"
                      dataKey="index"
                      fill={`${theme.colors.electricCyan}33`}
                      stroke="none"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Seasonal heatmap */}
            <div style={{ flex: 1 }}>
              <div style={{ height: '100%' }}>
                <SeasonalHeatmap 
                  data={heatmapData}
                  title="Multi-Year Pattern Analysis"
                  subtitle={`${viewType} seasonality patterns`}
                  height="100%"
                  showValues={true}
                  valueThreshold={1.15}
                />
              </div>
            </div>
          </div>
          
          {/* Side metrics panel */}
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: theme.colors.graphite,
              borderRadius: '8px',
              padding: '16px',
              height: '100%'
            }}>
              <div style={{ 
                color: theme.colors.cloudWhite,
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semiBold,
                marginBottom: '16px'
              }}>
                Seasonal Insights
              </div>
              
              {seasonalPattern && (
                <>
                  <MetricCard
                    label="Peak Season"
                    value={seasonalPattern.peakSeason}
                  />
                  
                  <MetricCard
                    label="Low Season"
                    value={seasonalPattern.lowSeason}
                  />
                  
                  <MetricCard
                    label="Amplitude"
                    value={seasonalPattern.amplitude.toFixed(2) + 'x'}
                  />
                  
                  <div style={{ 
                    backgroundColor: theme.colors.midnight,
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '24px'
                  }}>
                    <div style={{ 
                      color: theme.colors.cloudWhite,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semiBold,
                      marginBottom: '8px'
                    }}>
                      Strategic Recommendations
                    </div>
                    
                    <div style={{ 
                      color: theme.colors.cloudWhite,
                      fontSize: theme.typography.fontSize.sm,
                      opacity: 0.8,
                      marginBottom: '8px'
                    }}>
                      • Increase inventory {seasonalPattern.peakSeason} - {
                        (() => {
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const peakIndex = months.indexOf(seasonalPattern.peakSeason);
                          const nextMonth = months[(peakIndex + 1) % 12];
                          return nextMonth;
                        })()
                      }
                    </div>
                    
                    <div style={{ 
                      color: theme.colors.cloudWhite,
                      fontSize: theme.typography.fontSize.sm,
                      opacity: 0.8,
                      marginBottom: '8px'
                    }}>
                      • Plan promotions for {seasonalPattern.lowSeason}
                    </div>
                    
                    <div style={{ 
                      color: theme.colors.cloudWhite,
                      fontSize: theme.typography.fontSize.sm,
                      opacity: 0.8
                    }}>
                      • Adjust staffing based on {seasonalPattern.strength > 0.8 ? 'strong' : 'moderate'} seasonal pattern
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ChartWrapper>
  );
};

export default SeasonalPatternDetector;