import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, HeatMap
} from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter } from '../../types';

interface DemandDriverAnalyzerProps {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
}

interface DemandDriver {
  driver: string;
  contribution: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  color: string;
}

interface DriverAdjustment {
  driver: string;
  value: number;
}

interface DriverCorrelation {
  driver1: string;
  driver2: string;
  correlation: number;
}

const DemandDriverAnalyzer: React.FC<DemandDriverAnalyzerProps> = ({
  horizon,
  metric,
  filters,
}) => {
  // Mock state for driver data
  const [driverData, setDriverData] = useState<DemandDriver[]>([]);
  const [driverAdjustments, setDriverAdjustments] = useState<DriverAdjustment[]>([]);
  const [correlationData, setCorrelationData] = useState<DriverCorrelation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timePeriod, setTimePeriod] = useState<string>('Current');
  const [adjustedForecast, setAdjustedForecast] = useState<{original: number, adjusted: number}>({
    original: 0,
    adjusted: 0,
  });

  // Generate mock data when parameters change
  useEffect(() => {
    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchData = () => {
      // Define demand drivers
      const drivers = [
        {
          driver: 'Base Demand',
          contribution: 45 + Math.random() * 10,
          confidence: 0.9,
          trend: 'stable' as const,
          color: '#00e0ff', // Electric Cyan
        },
        {
          driver: 'Seasonal Factors',
          contribution: 20 + Math.random() * 10,
          confidence: 0.85,
          trend: 'increasing' as const,
          color: '#5fd4d6', // Lighter cyan
        },
        {
          driver: 'Promotional Effect',
          contribution: 15 + Math.random() * 5,
          confidence: 0.75,
          trend: 'increasing' as const,
          color: '#e930ff', // Signal Magenta
        },
        {
          driver: 'Price Effect',
          contribution: 10 + Math.random() * 5,
          confidence: 0.8,
          trend: 'decreasing' as const,
          color: '#aa45dd', // Muted purple
        },
        {
          driver: 'Other Factors',
          contribution: 5 + Math.random() * 5,
          confidence: 0.6,
          trend: 'stable' as const,
          color: '#447799', // Slate blue
        },
      ];
      
      // Normalize contributions to sum to 100%
      const totalContribution = drivers.reduce((sum, driver) => sum + driver.contribution, 0);
      const normalizedDrivers = drivers.map(driver => ({
        ...driver,
        contribution: (driver.contribution / totalContribution) * 100,
      }));
      
      // Initialize driver adjustments
      const adjustments = normalizedDrivers.map(driver => ({
        driver: driver.driver,
        value: 0, // 0% adjustment
      }));
      
      // Generate correlation data
      const correlations: DriverCorrelation[] = [];
      for (let i = 0; i < normalizedDrivers.length; i++) {
        for (let j = i + 1; j < normalizedDrivers.length; j++) {
          // Generate a random correlation between -0.8 and 0.8
          const correlation = (Math.random() * 1.6) - 0.8;
          
          correlations.push({
            driver1: normalizedDrivers[i].driver,
            driver2: normalizedDrivers[j].driver,
            correlation,
          });
        }
      }
      
      // Set mock forecast values
      const originalForecast = 1200000 + Math.random() * 300000;
      
      setDriverData(normalizedDrivers);
      setDriverAdjustments(adjustments);
      setCorrelationData(correlations);
      setAdjustedForecast({
        original: originalForecast,
        adjusted: originalForecast,
      });
      setLoading(false);
    };
    
    // Simulate API delay
    setTimeout(fetchData, 500);
  }, [horizon, metric, filters, timePeriod]);

  // Handle driver adjustment changes
  const handleAdjustmentChange = (driver: string, value: number) => {
    // Update adjustment value
    const newAdjustments = driverAdjustments.map(adj => 
      adj.driver === driver ? { ...adj, value } : adj
    );
    setDriverAdjustments(newAdjustments);
    
    // Recalculate adjusted forecast
    const totalImpact = newAdjustments.reduce((impact, adj) => {
      const driverContribution = driverData.find(d => d.driver === adj.driver)?.contribution || 0;
      return impact + (driverContribution * adj.value / 100);
    }, 0);
    
    setAdjustedForecast({
      ...adjustedForecast,
      adjusted: adjustedForecast.original * (1 + totalImpact / 100),
    });
  };

  // Reset all adjustments
  const handleResetAdjustments = () => {
    const resetAdjustments = driverAdjustments.map(adj => ({
      ...adj,
      value: 0,
    }));
    setDriverAdjustments(resetAdjustments);
    setAdjustedForecast({
      ...adjustedForecast,
      adjusted: adjustedForecast.original,
    });
  };

  // Prepare data for contribution chart (horizontal stacked bar)
  const contributionChartData = [
    {
      name: 'Demand',
      ...driverData.reduce((acc, driver) => {
        acc[driver.driver] = driver.contribution;
        return acc;
      }, {} as Record<string, number>),
    },
  ];

  // Prepare data for driver impact grid
  const driverGridData = driverData.map((driver, index) => ({
    id: index + 1,
    driver: driver.driver,
    contribution: driver.contribution,
    confidence: driver.confidence * 100,
    trend: driver.trend,
    color: driver.color,
  }));

  // Custom tooltip for contribution chart
  const ContributionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const driver = driverData.find(d => d.driver === payload[0].name);
      
      return (
        <div className="bg-midnight-navy p-4 rounded-md shadow-lg border border-electric-cyan">
          <p className="text-cloud-white font-semibold">{payload[0].name}</p>
          <p style={{ color: driver?.color }}>
            Contribution: {payload[0].value.toFixed(1)}%
          </p>
          <p className="text-cloud-white">
            Confidence: {(driver?.confidence || 0) * 100}%
          </p>
          <p className="text-cloud-white">
            Trend: {driver?.trend.charAt(0).toUpperCase() + driver?.trend.slice(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Render trend indicator
  const TrendIndicator = ({ trend }: { trend: string }) => {
    const symbol = trend === 'increasing' 
      ? '↑' 
      : trend === 'decreasing' 
        ? '↓' 
        : '→';
        
    const color = trend === 'increasing' 
      ? 'text-electric-cyan' 
      : trend === 'decreasing' 
        ? 'text-signal-magenta' 
        : 'text-cloud-white';
        
    return <span className={color}>{symbol}</span>;
  };

  // Format number with commas and 1 decimal place
  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-cloud-white">Demand Driver Analyzer</h2>
        <div className="flex space-x-2">
          {/* Time period selector */}
          <select
            className="bg-midnight-navy text-cloud-white p-2 rounded-md"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          >
            <option value="Current">Current Period</option>
            <option value="Previous">Previous Period</option>
            <option value="YoY">Year-over-Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Driver contribution chart - takes 3 columns */}
        <div className="lg:col-span-3 bg-midnight-navy rounded-xl p-4">
          <h3 className="text-lg font-semibold text-cloud-white mb-4">Driver Contribution</h3>
          
          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <div className="text-electric-cyan">Loading driver contributions...</div>
            </div>
          ) : (
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={contributionChartData}
                  margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#f7f9fb" 
                    tick={{ fill: '#f7f9fb' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#f7f9fb" 
                    tick={{ fill: '#f7f9fb' }}
                    width={1}
                    tickLine={false}
                  />
                  <Tooltip content={<ContributionTooltip />} />
                  
                  {driverData.map((driver) => (
                    <Bar 
                      key={driver.driver} 
                      dataKey={driver.driver} 
                      stackId="a" 
                      fill={driver.color}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Driver impact grid */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-cloud-white mb-3">Driver Impact Grid</h3>
            
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-graphite rounded"></div>
                <div className="h-8 bg-graphite rounded"></div>
                <div className="h-8 bg-graphite rounded"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-cloud-white">
                  <thead className="text-left bg-graphite">
                    <tr>
                      <th className="p-2 rounded-tl-md">Driver</th>
                      <th className="p-2">Impact</th>
                      <th className="p-2">Confidence</th>
                      <th className="p-2 rounded-tr-md">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverGridData.map((driver) => (
                      <tr key={driver.id} className="border-b border-graphite hover:bg-midnight-navy/50">
                        <td className="p-2 flex items-center">
                          <span 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: driver.color }}
                          ></span>
                          {driver.driver}
                        </td>
                        <td className="p-2">{driver.contribution.toFixed(1)}%</td>
                        <td className="p-2">
                          <div className="flex items-center">
                            <div className="w-16 h-2 bg-graphite rounded-full mr-2">
                              <div 
                                className="h-full bg-electric-cyan rounded-full"
                                style={{ width: `${driver.confidence}%` }}
                              ></div>
                            </div>
                            {driver.confidence.toFixed(0)}%
                          </div>
                        </td>
                        <td className="p-2">
                          <TrendIndicator trend={driver.trend} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Driver correlation section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-cloud-white mb-3">Driver Correlations</h3>
            
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="text-electric-cyan">Loading correlation data...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {correlationData
                  .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
                  .slice(0, 4)
                  .map((corr, index) => (
                    <div 
                      key={index}
                      className="bg-graphite rounded-lg p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-cloud-white">{corr.driver1} & {corr.driver2}</p>
                        <p className={`text-sm ${
                          corr.correlation > 0.3 ? 'text-electric-cyan' : 
                          corr.correlation < -0.3 ? 'text-signal-magenta' : 
                          'text-cloud-white opacity-70'
                        }`}>
                          {corr.correlation > 0 ? 'Positive' : 
                           corr.correlation < 0 ? 'Negative' : 
                           'No'} correlation
                        </p>
                      </div>
                      <div className="text-xl font-semibold">
                        <span className={
                          corr.correlation > 0.3 ? 'text-electric-cyan' : 
                          corr.correlation < -0.3 ? 'text-signal-magenta' : 
                          'text-cloud-white'
                        }>
                          {corr.correlation.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Driver adjustment panel - takes 2 columns */}
        <div className="lg:col-span-2 bg-midnight-navy rounded-xl p-4 flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-cloud-white">Factor Adjustment</h3>
          
          <div className="flex-1 space-y-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-graphite rounded"></div>
                <div className="h-16 bg-graphite rounded"></div>
                <div className="h-16 bg-graphite rounded"></div>
              </div>
            ) : (
              <>
                {/* Sliders for each driver */}
                {driverAdjustments.map((adjustment) => {
                  const driver = driverData.find(d => d.driver === adjustment.driver);
                  
                  return (
                    <div key={adjustment.driver} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: driver?.color }}
                          ></span>
                          <span className="text-cloud-white text-sm">{adjustment.driver}</span>
                        </div>
                        <span className={`text-sm ${
                          adjustment.value > 0 ? 'text-electric-cyan' : 
                          adjustment.value < 0 ? 'text-signal-magenta' : 
                          'text-cloud-white'
                        }`}>
                          {adjustment.value > 0 ? '+' : ''}{adjustment.value}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="5"
                        value={adjustment.value}
                        onChange={(e) => handleAdjustmentChange(adjustment.driver, parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  );
                })}
                
                {/* Forecast impact preview */}
                <div className="bg-graphite rounded-lg p-3 mt-6">
                  <h4 className="text-cloud-white font-semibold">Forecast Impact</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-cloud-white opacity-70">Original Forecast</p>
                      <p className="text-lg font-semibold text-cloud-white">
                        {formatNumber(adjustedForecast.original, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-cloud-white opacity-70">Adjusted Forecast</p>
                      <p className={`text-lg font-semibold ${
                        adjustedForecast.adjusted > adjustedForecast.original ? 'text-electric-cyan' : 
                        adjustedForecast.adjusted < adjustedForecast.original ? 'text-signal-magenta' : 
                        'text-cloud-white'
                      }`}>
                        {formatNumber(adjustedForecast.adjusted, 0)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-cloud-white opacity-70">Change</p>
                    <p className={`text-sm ${
                      adjustedForecast.adjusted > adjustedForecast.original ? 'text-electric-cyan' : 
                      adjustedForecast.adjusted < adjustedForecast.original ? 'text-signal-magenta' : 
                      'text-cloud-white'
                    }`}>
                      {adjustedForecast.adjusted > adjustedForecast.original ? '+' : ''}
                      {formatNumber(adjustedForecast.adjusted - adjustedForecast.original, 0)} 
                      ({formatNumber((adjustedForecast.adjusted / adjustedForecast.original - 1) * 100)}%)
                    </p>
                  </div>
                </div>
                
                {/* Reset button */}
                <button 
                  className="w-full bg-midnight-navy border border-cloud-white text-cloud-white font-semibold py-2 rounded-lg hover:bg-graphite transition-colors mt-4"
                  onClick={handleResetAdjustments}
                >
                  Reset to Baseline
                </button>
                
                {/* Apply to Forecast button */}
                <button 
                  className="w-full bg-electric-cyan text-midnight-navy font-semibold py-2 rounded-lg hover:bg-electric-cyan/90 transition-colors"
                >
                  Apply to Forecast
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Key insights */}
      <div className="bg-midnight-navy rounded-xl p-4">
        <h3 className="text-lg font-semibold text-cloud-white mb-3">Key Driver Insights</h3>
        
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-graphite rounded w-3/4"></div>
            <div className="h-4 bg-graphite rounded w-1/2"></div>
            <div className="h-4 bg-graphite rounded w-5/6"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-graphite rounded-lg p-3">
              <h4 className="text-cloud-white font-semibold">Primary Driver</h4>
              <p className="text-sm text-cloud-white opacity-80 mt-1">
                <span className="text-electric-cyan font-semibold">
                  {driverData.sort((a, b) => b.contribution - a.contribution)[0].driver}
                </span> is the most significant driver at {driverData.sort((a, b) => b.contribution - a.contribution)[0].contribution.toFixed(1)}% of demand, with {(driverData.sort((a, b) => b.contribution - a.contribution)[0].confidence * 100).toFixed(0)}% confidence.
              </p>
            </div>
            
            <div className="bg-graphite rounded-lg p-3">
              <h4 className="text-cloud-white font-semibold">Growth Opportunity</h4>
              <p className="text-sm text-cloud-white opacity-80 mt-1">
                Focusing on {driverData.filter(d => d.trend === 'increasing').sort((a, b) => b.contribution - a.contribution)[0]?.driver || 'Promotional Effect'} shows strongest growth potential with an increasing trend.
              </p>
            </div>
            
            <div className="bg-graphite rounded-lg p-3">
              <h4 className="text-cloud-white font-semibold">Improvement Focus</h4>
              <p className="text-sm text-cloud-white opacity-80 mt-1">
                Improving forecast accuracy for {driverData.sort((a, b) => a.confidence - b.confidence)[0].driver} would have the biggest impact on overall forecast quality.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemandDriverAnalyzer;