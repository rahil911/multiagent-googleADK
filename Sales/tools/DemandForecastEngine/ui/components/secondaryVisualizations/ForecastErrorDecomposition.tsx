import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Line, ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter } from '../../types';

interface ForecastErrorDecompositionProps {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
}

interface ErrorComponent {
  period: string;
  trend: number;
  seasonal: number;
  random: number;
  systemic: number;
  total: number;
}

const ForecastErrorDecomposition: React.FC<ForecastErrorDecompositionProps> = ({
  horizon,
  metric,
  filters,
}) => {
  // Mock state for error data
  const [errorData, setErrorData] = useState<ErrorComponent[]>([]);
  const [errorBreakdown, setErrorBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [periodSelection, setPeriodSelection] = useState<string>('All periods');
  const [viewMode, setViewMode] = useState<'absolute' | 'percentage'>('percentage');
  const [cumulativeView, setCumulativeView] = useState<boolean>(false);
  
  // Generate mock data when parameters change
  useEffect(() => {
    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchData = () => {
      // Generate error component data
      const data: ErrorComponent[] = [];
      const today = new Date();
      
      // Define component totals for breakdown
      let trendTotal = 0;
      let seasonalTotal = 0;
      let randomTotal = 0;
      let systemicTotal = 0;
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - (11 - i));
        
        // Generate random error components
        const trendError = Math.random() * 3 + 1; // 1-4%
        const seasonalError = Math.random() * 4 + 1; // 1-5%
        const randomError = Math.random() * 2 + 0.5; // 0.5-2.5%
        const systemicError = Math.random() * 2 + 0.5; // 0.5-2.5%
        
        // Calculate total error
        const totalError = trendError + seasonalError + randomError + systemicError;
        
        trendTotal += trendError;
        seasonalTotal += seasonalError;
        randomTotal += randomError;
        systemicTotal += systemicError;
        
        data.push({
          period: date.toISOString().split('T')[0].substr(0, 7), // YYYY-MM format
          trend: trendError,
          seasonal: seasonalError,
          random: randomError,
          systemic: systemicError,
          total: totalError,
        });
      }
      
      // Calculate overall error breakdown for donut chart
      const total = trendTotal + seasonalTotal + randomTotal + systemicTotal;
      
      const breakdown = [
        {
          name: 'Trend',
          value: trendTotal / total * 100,
          color: '#00e0ff', // Electric Cyan
        },
        {
          name: 'Seasonal',
          value: seasonalTotal / total * 100,
          color: '#5fd4d6', // Lighter cyan
        },
        {
          name: 'Random',
          value: randomTotal / total * 100,
          color: '#e930ff', // Signal Magenta
        },
        {
          name: 'Systemic',
          value: systemicTotal / total * 100,
          color: '#aa45dd', // Muted purple
        },
      ];
      
      setErrorData(data);
      setErrorBreakdown(breakdown);
      setLoading(false);
    };
    
    // Simulate API delay
    setTimeout(fetchData, 500);
  }, [horizon, metric, filters, periodSelection]);

  // Filter data based on period selection
  const filteredData = (() => {
    if (periodSelection === 'All periods') {
      return errorData;
    }
    
    const periods = parseInt(periodSelection.split(' ')[1]);
    return errorData.slice(-periods);
  })();

  // Prepare data for current view mode (absolute or percentage)
  const preparedData = filteredData.map(item => {
    if (viewMode === 'percentage') {
      // Convert to percentages of total
      const total = item.trend + item.seasonal + item.random + item.systemic;
      return {
        ...item,
        trend: (item.trend / total) * 100,
        seasonal: (item.seasonal / total) * 100,
        random: (item.random / total) * 100,
        systemic: (item.systemic / total) * 100,
      };
    }
    return item;
  });

  // Calculate error metrics for the selected period
  const errorMetrics = (() => {
    if (!filteredData.length) return null;
    
    // Calculate averages
    const trendAvg = filteredData.reduce((sum, item) => sum + item.trend, 0) / filteredData.length;
    const seasonalAvg = filteredData.reduce((sum, item) => sum + item.seasonal, 0) / filteredData.length;
    const randomAvg = filteredData.reduce((sum, item) => sum + item.random, 0) / filteredData.length;
    const systemicAvg = filteredData.reduce((sum, item) => sum + item.systemic, 0) / filteredData.length;
    const totalAvg = filteredData.reduce((sum, item) => sum + item.total, 0) / filteredData.length;
    
    return {
      trendAvg,
      seasonalAvg,
      randomAvg,
      systemicAvg,
      totalAvg,
    };
  })();

  // Custom tooltip for bar chart
  const ErrorTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload.reduce((acc: any, entry: any) => {
        acc[entry.dataKey] = entry.value;
        acc.color = entry.color;
        return acc;
      }, {});
      
      return (
        <div className="bg-midnight-navy p-4 rounded-md shadow-lg border border-electric-cyan">
          <p className="text-cloud-white font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {viewMode === 'percentage' 
                ? `${entry.value.toFixed(1)}%` 
                : `${entry.value.toFixed(2)}%`}
            </p>
          ))}
          <p className="text-cloud-white mt-1">
            Total: {viewMode === 'percentage' 
              ? '100%' 
              : `${payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toFixed(2)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-cloud-white">Forecast Error Decomposition</h2>
        <div className="flex space-x-2">
          {/* Period selector */}
          <select
            className="bg-midnight-navy text-cloud-white p-2 rounded-md"
            value={periodSelection}
            onChange={(e) => setPeriodSelection(e.target.value)}
          >
            <option value="All periods">All periods</option>
            <option value="Last 3 periods">Last 3 periods</option>
            <option value="Last 6 periods">Last 6 periods</option>
            <option value="Last 12 periods">Last 12 periods</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Error component chart - takes 3 columns */}
        <div className="lg:col-span-3 bg-midnight-navy rounded-xl p-4 h-80">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-electric-cyan">Loading error decomposition...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={preparedData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" opacity={0.2} />
                <XAxis 
                  dataKey="period" 
                  stroke="#f7f9fb"
                  tick={{ fill: '#f7f9fb' }} 
                />
                <YAxis 
                  stroke="#f7f9fb" 
                  tick={{ fill: '#f7f9fb' }}
                  label={{ 
                    value: viewMode === 'percentage' ? 'Error Component (%)' : 'Error Magnitude (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#f7f9fb'
                  }}
                />
                <Tooltip content={<ErrorTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  wrapperStyle={{ paddingBottom: '10px' }} 
                />
                
                <Bar 
                  dataKey="trend" 
                  name="Trend Error" 
                  stackId="a" 
                  fill="#00e0ff" // Electric Cyan
                  animationDuration={500}
                />
                <Bar 
                  dataKey="seasonal" 
                  name="Seasonal Error" 
                  stackId="a" 
                  fill="#5fd4d6" // Lighter cyan
                  animationDuration={500}
                />
                <Bar 
                  dataKey="random" 
                  name="Random Error" 
                  stackId="a" 
                  fill="#e930ff" // Signal Magenta
                  animationDuration={500}
                />
                <Bar 
                  dataKey="systemic" 
                  name="Systemic Error" 
                  stackId="a" 
                  fill="#aa45dd" // Muted purple
                  animationDuration={500}
                />
                
                {/* Total error line */}
                {viewMode === 'absolute' && (
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Error"
                    stroke="#f7f9fb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Error breakdown donut - takes 1 column */}
        <div className="bg-midnight-navy rounded-xl p-4 flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-cloud-white text-center">Error Breakdown</h3>
          
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="text-electric-cyan">Loading...</div>
            </div>
          ) : (
            <div className="h-48 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                    labelLine={false}
                  >
                    {errorBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Contribution']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* View controls */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-cloud-white text-sm">View Mode:</span>
              <div className="flex rounded-full bg-midnight-navy p-1">
                {(['percentage', 'absolute'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      viewMode === mode
                        ? 'bg-electric-cyan text-midnight-navy'
                        : 'text-cloud-white hover:bg-graphite'
                    }`}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-cloud-white text-sm">View Type:</span>
              <div className="flex rounded-full bg-midnight-navy p-1">
                {([
                  { id: false, label: 'Per-period' },
                  { id: true, label: 'Cumulative' },
                ] as const).map(({ id, label }) => (
                  <button
                    key={label}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      cumulativeView === id
                        ? 'bg-electric-cyan text-midnight-navy'
                        : 'text-cloud-white hover:bg-graphite'
                    }`}
                    onClick={() => setCumulativeView(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Error metrics */}
          {errorMetrics && (
            <div className="mt-4 p-3 bg-graphite rounded-lg">
              <h4 className="text-sm font-semibold text-cloud-white">Error Statistics</h4>
              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-cloud-white">Average Error:</span>
                  <span className="text-electric-cyan">{errorMetrics.totalAvg.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud-white">Largest Component:</span>
                  <span className="text-electric-cyan">
                    {errorBreakdown.sort((a, b) => b.value - a.value)[0].name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud-white">Improvement Focus:</span>
                  <span className="text-signal-magenta">
                    {errorBreakdown.sort((a, b) => b.value - a.value)[0].name}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Improvement suggestions */}
      <div className="bg-midnight-navy rounded-xl p-4">
        <h3 className="text-lg font-semibold text-cloud-white mb-3">Error Reduction Suggestions</h3>
        
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-graphite rounded w-3/4"></div>
            <div className="h-4 bg-graphite rounded w-1/2"></div>
            <div className="h-4 bg-graphite rounded w-5/6"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-graphite rounded-lg p-3">
              <h4 className="text-cloud-white font-semibold">Trend Error Reduction</h4>
              <p className="text-sm text-cloud-white opacity-80 mt-1">
                Implement weighted moving average model to better capture long-term trend patterns.
                Current trend component accounts for {errorBreakdown.find(e => e.name === 'Trend')?.value.toFixed(0)}% of total error.
              </p>
            </div>
            
            <div className="bg-graphite rounded-lg p-3">
              <h4 className="text-cloud-white font-semibold">Seasonal Error Reduction</h4>
              <p className="text-sm text-cloud-white opacity-80 mt-1">
                Refine seasonality detection by incorporating multiple years of historical data.
                Seasonal component is {errorBreakdown.find(e => e.name === 'Seasonal')?.value.toFixed(0)}% of total error.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastErrorDecomposition;