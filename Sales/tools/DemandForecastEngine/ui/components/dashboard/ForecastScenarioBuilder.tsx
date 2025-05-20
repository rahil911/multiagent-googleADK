import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ReferenceLine, Area
} from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter, ForecastData, ScenarioParams } from '../../types';
import ChartWrapper from '../common/ChartWrapper';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '../../utils/chartHelpers';

interface ForecastScenarioBuilderProps {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  confidenceLevel: number;
  filters: DimensionFilter;
}

const ForecastScenarioBuilder: React.FC<ForecastScenarioBuilderProps> = ({
  horizon,
  metric,
  confidenceLevel,
  filters,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [baselineData, setBaselineData] = useState<ForecastData[]>([]);
  const [scenarioData, setScenarioData] = useState<{[key: string]: ForecastData[]}>({});
  const [activeScenarios, setActiveScenarios] = useState<string[]>(['Baseline']);
  
  // Scenario parameters
  const [scenarios, setScenarios] = useState<{[key: string]: ScenarioParams}>({
    'Baseline': {
      name: 'Baseline',
      color: '#00e0ff', // Electric Cyan
      growthAssumption: 0,
      seasonalityStrength: 100,
      priceAdjustment: 0,
      customEvents: [],
    },
    'Growth': {
      name: 'Growth',
      color: '#00C853', // Success green
      growthAssumption: 15,
      seasonalityStrength: 100,
      priceAdjustment: 0,
      customEvents: [],
    },
    'Recession': {
      name: 'Recession',
      color: '#FF5252', // Error red
      growthAssumption: -10,
      seasonalityStrength: 100,
      priceAdjustment: -5,
      customEvents: [],
    }
  });

  // Editing state
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [scenarioForm, setScenarioForm] = useState<ScenarioParams>({
    name: '',
    color: '#00e0ff',
    growthAssumption: 0,
    seasonalityStrength: 100,
    priceAdjustment: 0,
    customEvents: [],
  });

  // Fetch initial data
  useEffect(() => {
    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchData = () => {
      // Generate mock baseline forecast data
      const today = new Date();
      const data: ForecastData[] = [];
      
      // Historical data (past 12 periods)
      for (let i = -12; i < 0; i++) {
        const date = new Date(today);
        
        // Adjust date based on forecast horizon
        if (horizon === 'week') {
          date.setDate(date.getDate() + (i * 7));
        } else if (horizon === 'month') {
          date.setMonth(date.getMonth() + i);
        } else if (horizon === 'quarter') {
          date.setMonth(date.getMonth() + (i * 3));
        } else if (horizon === 'year') {
          date.setFullYear(date.getFullYear() + i);
        }
        
        const baseValue = 1000 + Math.random() * 500;
        // Add seasonality
        const seasonality = Math.sin(date.getMonth() / 12 * Math.PI * 2) * 200;
        const actual = baseValue + seasonality + (i * 50); // Upward trend
        
        data.push({
          date: date.toISOString().split('T')[0],
          actual: metric === 'revenue' ? actual * 10 : actual,
          forecast: 0, // No forecast for historical data
          lowerBound: 0,
          upperBound: 0,
        });
      }
      
      // Forecast data (next 12 periods)
      for (let i = 0; i < 12; i++) {
        const date = new Date(today);
        
        // Adjust date based on forecast horizon
        if (horizon === 'week') {
          date.setDate(date.getDate() + (i * 7));
        } else if (horizon === 'month') {
          date.setMonth(date.getMonth() + i);
        } else if (horizon === 'quarter') {
          date.setMonth(date.getMonth() + (i * 3));
        } else if (horizon === 'year') {
          date.setFullYear(date.getFullYear() + i);
        }
        
        const lastActual = data[data.length - 1].actual;
        const baseValue = lastActual + (i * 75); // Continue trend
        // Add seasonality
        const seasonality = Math.sin(date.getMonth() / 12 * Math.PI * 2) * 200;
        const forecast = baseValue + seasonality;
        // Confidence interval widens as we look further into the future
        const interval = (forecast * 0.05) * (1 + (i * 0.5)) * (1 - ((confidenceLevel - 50) / 50));
        
        data.push({
          date: date.toISOString().split('T')[0],
          actual: 0, // No actual for forecast data
          forecast: forecast,
          lowerBound: forecast - interval,
          upperBound: forecast + interval,
        });
      }
      
      // Set baseline data
      setBaselineData(data);
      
      // Generate scenario data
      const scenarioResults: {[key: string]: ForecastData[]} = {};
      
      Object.values(scenarios).forEach(scenario => {
        // Skip baseline as we already have it
        if (scenario.name === 'Baseline') {
          scenarioResults['Baseline'] = data;
          return;
        }
        
        // Find last historical data point (the most recent actual value)
        const historicalData = data.filter(d => d.actual > 0);
        const lastHistoricalPoint = historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;
        
        // Apply growth assumption to each forecast point
        const scenarioData = data.map(point => {
          // Only modify forecast points
          if (point.forecast === 0) {
            return { ...point };
          }
          
          // Apply growth 
          const growthMultiplier = 1 + (scenario.growthAssumption / 100);
          
          // Apply price adjustment if metric is revenue
          const priceMultiplier = metric === 'revenue' 
            ? 1 + (scenario.priceAdjustment / 100) 
            : 1;
          
          // Apply seasonality strength
          const seasonalityMultiplier = (scenario.seasonalityStrength / 100);
          
          // Calculate new forecast value
          const baselineValue = point.forecast;
          
          // Safely access the last historical point for seasonal component calculation
          let seasonalComponent = 0;
          let trendComponent = baselineValue;
          
          if (lastHistoricalPoint) {
            // Use the last actual value as the trend base and calculate seasonal component
            seasonalComponent = baselineValue - lastHistoricalPoint.actual;
            trendComponent = lastHistoricalPoint.actual;
          }
          
          const newForecast = (trendComponent * growthMultiplier * priceMultiplier) + 
                             (seasonalComponent * seasonalityMultiplier);
          
          // Adjust confidence interval
          const index = data.findIndex(d => d.date === point.date);
          const newInterval = (newForecast * 0.05) * (1 + (index > 0 ? index * 0.5 : 0)) * 
                             (1 - ((confidenceLevel - 50) / 50));
          
          return {
            ...point,
            forecast: newForecast,
            lowerBound: newForecast - newInterval,
            upperBound: newForecast + newInterval,
          };
        });
        
        scenarioResults[scenario.name] = scenarioData;
      });
      
      setScenarioData(scenarioResults);
      setLoading(false);
    };
    
    // Simulate API delay
    setTimeout(fetchData, 500);
  }, [horizon, metric, confidenceLevel, filters]);

  // Format value for tooltip
  const formatTooltipValue = (value: number) => {
    if (value === 0) return '-';
    return metric === 'revenue' ? formatCurrency(value) : formatNumber(value);
  };

  // Format date for X-axis
  const formatXAxis = (dateStr: string) => {
    return formatDate(dateStr, horizon);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = formatDate(label, horizon);
      
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
            {date}
          </p>
          
          {payload.map((entry: any, index: number) => {
            const dataKey = entry.dataKey;
            const scenarioName = entry.name;
            const value = entry.value;
            const color = entry.color;
            
            if (value === 0 || !value) return null;
            
            return (
              <p key={`${scenarioName}-${dataKey}-${index}`} style={{ 
                color: color,
                margin: '4px 0',
                fontSize: theme.typography.fontSize.sm
              }}>
                {scenarioName}: {formatTooltipValue(value)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Toggle a scenario's visibility
  const toggleScenario = (scenarioName: string) => {
    if (activeScenarios.includes(scenarioName)) {
      setActiveScenarios(activeScenarios.filter(name => name !== scenarioName));
    } else {
      setActiveScenarios([...activeScenarios, scenarioName]);
    }
  };

  // Start editing a scenario
  const startEditing = (scenarioName: string) => {
    // If 'New', initialize with default values
    if (scenarioName === 'New') {
      setScenarioForm({
        name: '',
        color: '#00e0ff',  // Default to Electric Cyan
        growthAssumption: 0,
        seasonalityStrength: 100,
        priceAdjustment: 0,
        customEvents: []
      });
    } else {
      // Find the existing scenario
      const scenario = scenarios[scenarioName];
      if (scenario) {
        setScenarioForm({ ...scenario });
      }
    }
    
    setEditingScenario(scenarioName);
  };

  // Save scenario changes
  const saveScenario = () => {
    if (!editingScenario) return;
    
    setScenarios({
      ...scenarios,
      [scenarioForm.name]: scenarioForm
    });
    
    setEditingScenario(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingScenario(null);
  };

  // Update form field
  const updateFormField = (field: keyof ScenarioParams, value: any) => {
    setScenarioForm(prev => {
      if (!prev) {
        // Initialize with default values if somehow prev is null/undefined
        return {
          name: '',
          color: '#00e0ff',
          growthAssumption: 0,
          seasonalityStrength: 100,
          priceAdjustment: 0,
          customEvents: [],
          [field]: value
        };
      }
      
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // Button styles for consistent appearance
  const buttonStyle = (primary: boolean = false) => ({
    backgroundColor: primary ? theme.colors.electricCyan : 'transparent',
    color: primary ? theme.colors.midnight : theme.colors.cloudWhite,
    border: primary ? 'none' : `1px solid ${theme.colors.graphiteDark}`,
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: primary ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  });

  // Safely find the last historical data point (the "today" reference)
  const todayReference = baselineData.filter(d => d.actual > 0).slice(-1)[0];

  return (
    <ChartWrapper
      title="Forecast Scenario Builder"
      isLoading={loading}
      height={600}
      actions={
        <button
          style={buttonStyle(true)}
          onClick={() => startEditing('New')}
        >
          + New Scenario
        </button>
      }
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        gap: '12px',
        width: '100%'
      }}>
        {/* Scenario chart */}
        <div style={{ 
          flex: 1, 
          minHeight: 0,
          position: 'relative',
          width: '100%'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={`${theme.colors.graphiteDark}33`} 
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke={theme.colors.cloudWhite}
                tick={{ fill: theme.colors.cloudWhite, fontSize: 12 }}
                allowDuplicatedCategory={false}
                height={35}
                tickMargin={10}
              />
              <YAxis 
                tickFormatter={(value) => formatTooltipValue(value)}
                stroke={theme.colors.cloudWhite}
                tick={{ fill: theme.colors.cloudWhite, fontSize: 12 }}
                width={60}
                tickMargin={5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value) => value} 
                verticalAlign="bottom"
                height={30}
                wrapperStyle={{ paddingTop: 10 }}
              />
              
              {/* Today reference line - only show if we have historical data */}
              {todayReference && (
                <ReferenceLine 
                  x={todayReference.date} 
                  label={{ 
                    value: 'Today', 
                    position: 'insideTopRight',
                    fill: theme.colors.cloudWhite,
                    fontSize: 12
                  }} 
                  stroke={theme.colors.cloudWhite}
                  strokeDasharray="3 3"
                />
              )}
              
              {/* Historical data - shown on all scenarios */}
              <Line
                type="monotone"
                data={baselineData.filter(d => d.actual > 0)}
                dataKey="actual"
                stroke={theme.colors.cloudWhite}
                strokeWidth={3}
                dot={{ r: 4, fill: theme.colors.cloudWhite }}
                activeDot={{ r: 6, fill: theme.colors.cloudWhite }}
                name="Historical"
              />
              
              {/* Render active scenarios */}
              {Object.keys(scenarios)
                .filter(scenarioName => activeScenarios.includes(scenarioName))
                .map(scenarioName => {
                  const scenario = scenarios[scenarioName];
                  const data = scenarioData[scenarioName] || [];
                  const forecastData = data.filter(d => d.forecast > 0);
                  
                  return (
                    <Line
                      key={scenarioName}
                      type="monotone"
                      data={forecastData}
                      dataKey="forecast"
                      stroke={scenario.color}
                      strokeWidth={2} 
                      strokeDasharray={scenarioName !== 'Baseline' ? "5 5" : undefined}
                      dot={{ r: 3, fill: scenario.color }}
                      activeDot={{ r: 5, fill: scenario.color }}
                      name={scenarioName}
                    />
                  );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario controls */}
        <div style={{ 
          backgroundColor: theme.colors.midnight,
          borderRadius: '8px',
          padding: '12px',
          flexShrink: 0,
          maxHeight: '180px',
          overflowY: 'auto'
        }}>
          {editingScenario ? (
            // Scenario form
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semiBold,
                color: theme.colors.cloudWhite,
                marginBottom: '8px'
              }}>
                {editingScenario === 'New' ? 'Create New Scenario' : 'Edit Scenario'}
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.cloudWhite,
                    marginBottom: '4px'
                  }}>
                    Name
                  </div>
                  <input
                    type="text"
                    value={scenarioForm?.name ?? ''}
                    onChange={(e) => updateFormField('name', e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: theme.colors.graphite,
                      border: `1px solid ${theme.colors.graphiteDark}`,
                      color: theme.colors.cloudWhite,
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: theme.typography.fontSize.sm
                    }}
                  />
                </div>
                
                <div>
                  <div style={{ 
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.cloudWhite,
                    marginBottom: '4px'
                  }}>
                    Color
                  </div>
                  <input
                    type="color"
                    value={scenarioForm?.color ?? '#00e0ff'}
                    onChange={(e) => updateFormField('color', e.target.value)}
                    style={{
                      width: '60px',
                      height: '35px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: theme.colors.graphite,
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div style={{ 
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.cloudWhite,
                  marginBottom: '4px'
                }}>
                  Growth Assumption: {scenarioForm?.growthAssumption > 0 ? '+' : ''}{scenarioForm?.growthAssumption ?? 0}%
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={scenarioForm?.growthAssumption ?? 0}
                  onChange={(e) => updateFormField('growthAssumption', Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: (scenarioForm?.growthAssumption ?? 0) >= 0 ? '#00C853' : '#FF5252'
                  }}
                />
              </div>
              
              <div>
                <div style={{ 
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.cloudWhite,
                  marginBottom: '4px'
                }}>
                  Seasonality Strength: {scenarioForm?.seasonalityStrength ?? 100}%
                </div>
                  <input 
                  type="range"
                  min="0"
                  max="200"
                  value={scenarioForm?.seasonalityStrength ?? 100}
                  onChange={(e) => updateFormField('seasonalityStrength', Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: theme.colors.electricCyan
                  }}
                />
              </div>
              
              {metric === 'revenue' && (
                <div>
                  <div style={{ 
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.cloudWhite,
                    marginBottom: '4px'
                  }}>
                    Price Adjustment: {scenarioForm?.priceAdjustment > 0 ? '+' : ''}{scenarioForm?.priceAdjustment ?? 0}%
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={scenarioForm?.priceAdjustment ?? 0}
                    onChange={(e) => updateFormField('priceAdjustment', Number(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: (scenarioForm?.priceAdjustment ?? 0) >= 0 ? '#00C853' : '#FF5252'
                    }}
                  />
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={cancelEditing}
                  style={buttonStyle(false)}
                >
                  Cancel
                </button>
                <button
                  onClick={saveScenario}
                  style={buttonStyle(true)}
                >
                  Save Scenario
                </button>
              </div>
            </div>
          ) : (
            // Scenario list
            <div>
              <div style={{ 
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semiBold,
                color: theme.colors.cloudWhite,
                marginBottom: '8px'
              }}>
                Scenarios
              </div>
            
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.values(scenarios).map(scenario => (
                  <div
                    key={scenario.name}
                    style={{
                      backgroundColor: activeScenarios.includes(scenario.name) 
                        ? theme.colors.graphite 
                        : theme.colors.midnight,
                      border: `1px solid ${activeScenarios.includes(scenario.name) 
                        ? scenario.color 
                        : theme.colors.graphiteDark}`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => toggleScenario(scenario.name)}
                  >
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: scenario.color,
                      borderRadius: '50%'
                    }} />
                    <span style={{ 
                      color: theme.colors.cloudWhite,
                      fontSize: theme.typography.fontSize.sm
                    }}>
                      {scenario.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(scenario.name);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: theme.colors.cloudWhite,
                        opacity: 0.6,
                        cursor: 'pointer',
                        fontSize: theme.typography.fontSize.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        padding: 0,
                        marginLeft: '4px'
                      }}
                    >
                      ✎
                    </button>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                marginTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                {activeScenarios.map(scenarioName => {
                  const scenario = scenarios[scenarioName];
                  if (!scenario) return null;
                  
                  return (
                    <div 
                      key={scenarioName}
                      style={{
                        backgroundColor: theme.colors.graphite,
                        borderRadius: '8px',
                        padding: '12px',
                        border: `1px solid ${scenario.color}`
                      }}
                    >
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{ 
                          color: theme.colors.cloudWhite,
                          fontSize: theme.typography.fontSize.md,
                          fontWeight: theme.typography.fontWeight.semiBold,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: scenario.color,
                            borderRadius: '50%'
                          }} />
                          {scenario.name}
                        </div>
                      </div>
                      
                      <div style={{ 
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.cloudWhite,
                        opacity: 0.8,
                        marginBottom: '4px'
                      }}>
                        <span style={{ display: 'inline-block', width: '120px' }}>Growth Rate:</span>
                        <span style={{ 
                          color: scenario.growthAssumption >= 0 ? '#00C853' : '#FF5252',
                          fontWeight: theme.typography.fontWeight.medium
                        }}>
                          {scenario.growthAssumption > 0 ? '+' : ''}{scenario.growthAssumption}%
                        </span>
                      </div>
                      
                      <div style={{ 
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.cloudWhite,
                        opacity: 0.8,
                        marginBottom: '4px'
                      }}>
                        <span style={{ display: 'inline-block', width: '120px' }}>Seasonality:</span>
                        <span style={{ 
                          color: theme.colors.electricCyan,
                          fontWeight: theme.typography.fontWeight.medium
                        }}>
                          {scenario.seasonalityStrength}%
                        </span>
                      </div>
                      
                      {metric === 'revenue' && (
                        <div style={{ 
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.cloudWhite,
                          opacity: 0.8
                        }}>
                          <span style={{ display: 'inline-block', width: '120px' }}>Price Change:</span>
                          <span style={{ 
                            color: scenario.priceAdjustment >= 0 ? '#00C853' : '#FF5252',
                            fontWeight: theme.typography.fontWeight.medium
                          }}>
                            {scenario.priceAdjustment > 0 ? '+' : ''}{scenario.priceAdjustment}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </ChartWrapper>
  );
};

export default ForecastScenarioBuilder;