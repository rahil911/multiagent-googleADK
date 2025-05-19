import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter, ForecastData } from '../../types';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/chartHelpers';

interface ForecastHorizonExplorerProps {
  horizon: ForecastHorizon;
  onHorizonChange: (horizon: ForecastHorizon) => void;
  metric: ForecastMetric;
  onMetricChange: (metric: ForecastMetric) => void;
  confidenceLevel: number;
  onConfidenceLevelChange: (level: number) => void;
  filters: DimensionFilter;
  onFilterChange: (filters: DimensionFilter) => void;
  onClearFilters: () => void;
}

const ForecastHorizonExplorer: React.FC<ForecastHorizonExplorerProps> = ({
  horizon,
  onHorizonChange,
  metric,
  onMetricChange,
  confidenceLevel,
  onConfidenceLevelChange,
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  // Mock data - would be fetched from API in real implementation
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalForecast, setTotalForecast] = useState<number>(0);
  const [growthProjection, setGrowthProjection] = useState<number>(0);
  const [averageDaily, setAverageDaily] = useState<number>(0);

  // Simulating data fetch on parameter changes
  useEffect(() => {
    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchData = () => {
      // Generate mock data based on selected parameters
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
      let totalForecastSum = 0;
      
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
        
        const forecastPoint = {
          date: date.toISOString().split('T')[0],
          actual: 0, // No actual for forecast data
          forecast: forecast,
          lowerBound: forecast - interval,
          upperBound: forecast + interval,
        };
        
        data.push(forecastPoint);
        totalForecastSum += forecast;
      }
      
      // Calculate aggregate metrics
      const avgDailyValue = totalForecastSum / 12;
      const lastHistoricalPeriodValue = data[11].actual;
      const firstForecastPeriodValue = data[12].forecast;
      const growth = (firstForecastPeriodValue - lastHistoricalPeriodValue) / lastHistoricalPeriodValue;
      
      setTotalForecast(totalForecastSum);
      setAverageDaily(avgDailyValue);
      setGrowthProjection(growth);
      setForecastData(data);
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-midnight-navy p-4 rounded-md shadow-lg border border-electric-cyan">
          <p className="text-cloud-white font-semibold">{label}</p>
          {data.actual > 0 && (
            <p className="text-electric-cyan">
              Actual: {formatTooltipValue(data.actual)}
            </p>
          )}
          {data.forecast > 0 && (
            <>
              <p className="text-signal-magenta">
                Forecast: {formatTooltipValue(data.forecast)}
              </p>
              <p className="text-signal-magenta opacity-70 text-sm">
                Range: {formatTooltipValue(data.lowerBound)} - {formatTooltipValue(data.upperBound)}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Filter components
  const ProductFilter = () => {
    const products = ["All Products", "Product A", "Product B", "Product C"];
    return (
      <select 
        className="bg-midnight-navy text-cloud-white p-2 rounded-md"
        value={filters.product || "All Products"}
        onChange={(e) => onFilterChange({ product: e.target.value !== "All Products" ? e.target.value : undefined })}
      >
        {products.map(product => (
          <option key={product} value={product}>{product}</option>
        ))}
      </select>
    );
  };

  const RegionFilter = () => {
    const regions = ["All Regions", "North", "South", "East", "West"];
    return (
      <select 
        className="bg-midnight-navy text-cloud-white p-2 rounded-md"
        value={filters.region || "All Regions"}
        onChange={(e) => onFilterChange({ region: e.target.value !== "All Regions" ? e.target.value : undefined })}
      >
        {regions.map(region => (
          <option key={region} value={region}>{region}</option>
        ))}
      </select>
    );
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-cloud-white">Forecast Horizon Explorer</h2>
        <div className="flex space-x-2">
          {/* Export & Share buttons would go here */}
          <button className="bg-midnight-navy text-cloud-white px-3 py-1 rounded-md hover:bg-electric-cyan hover:text-midnight-navy transition-colors">
            Export
          </button>
          <button className="bg-midnight-navy text-cloud-white px-3 py-1 rounded-md hover:bg-electric-cyan hover:text-midnight-navy transition-colors">
            Share
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Forecast period selector */}
        <div className="flex rounded-full bg-midnight-navy p-1">
          {(['week', 'month', 'quarter', 'year'] as ForecastHorizon[]).map((period) => (
            <button
              key={period}
              className={`flex-1 px-3 py-1 rounded-full transition-colors ${
                horizon === period
                  ? 'bg-electric-cyan text-midnight-navy'
                  : 'text-cloud-white hover:bg-graphite'
              }`}
              onClick={() => onHorizonChange(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        {/* Metric selector */}
        <div className="flex rounded-full bg-midnight-navy p-1">
          {(['quantity', 'revenue'] as ForecastMetric[]).map((metricOption) => (
            <button
              key={metricOption}
              className={`flex-1 px-3 py-1 rounded-full transition-colors ${
                metric === metricOption
                  ? 'bg-electric-cyan text-midnight-navy'
                  : 'text-cloud-white hover:bg-graphite'
              }`}
              onClick={() => onMetricChange(metricOption)}
            >
              {metricOption.charAt(0).toUpperCase() + metricOption.slice(1)}
            </button>
          ))}
        </div>

        {/* Dimension filters */}
        <div className="flex space-x-2">
          <ProductFilter />
          <RegionFilter />
        </div>

        {/* Reset filters button */}
        <button
          className="bg-midnight-navy text-cloud-white px-3 py-1 rounded-md hover:bg-electric-cyan hover:text-midnight-navy transition-colors"
          onClick={onClearFilters}
        >
          Reset Filters
        </button>
      </div>

      {/* Confidence level slider */}
      <div className="flex items-center space-x-4">
        <span className="text-cloud-white">Confidence Level:</span>
        <input
          type="range"
          min="50"
          max="95"
          step="5"
          value={confidenceLevel}
          onChange={(e) => onConfidenceLevelChange(parseInt(e.target.value))}
          className="flex-1"
        />
        <span className="text-electric-cyan font-semibold">{confidenceLevel}%</span>
      </div>

      {/* Main chart */}
      <div className="h-96">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-electric-cyan">Loading forecast data...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={forecastData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="#f7f9fb"
                tick={{ fill: '#f7f9fb' }} 
              />
              <YAxis 
                stroke="#f7f9fb" 
                tick={{ fill: '#f7f9fb' }}
                tickFormatter={(value) => 
                  metric === 'revenue' 
                    ? formatCurrency(value).replace(/\d+/g, 'K') 
                    : (value > 1000 ? `${(value/1000).toFixed(0)}K` : value.toString())
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Reference line for current date */}
              <ReferenceLine 
                x={forecastData[11].date} 
                stroke="#f7f9fb" 
                strokeDasharray="3 3" 
                label={{ 
                  value: 'Today', 
                  position: 'insideTopRight',
                  fill: '#f7f9fb',
                  fontSize: 12 
                }} 
              />
              
              {/* Historical data line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#00e0ff"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
                name="Historical"
              />
              
              {/* Forecast line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#e930ff"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
                name="Forecast"
              />
              
              {/* Confidence interval area - would be Area component in real implementation */}
              <Line
                type="monotone"
                dataKey="upperBound"
                stroke="#e930ff"
                strokeWidth={1}
                strokeOpacity={0.3}
                dot={false}
                activeDot={false}
                name="Upper Bound"
              />
              <Line
                type="monotone"
                dataKey="lowerBound"
                stroke="#e930ff"
                strokeWidth={1}
                strokeOpacity={0.3}
                dot={false}
                activeDot={false}
                name="Lower Bound"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Forecast summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-midnight-navy rounded-xl p-4">
        <div className="text-center">
          <h3 className="text-cloud-white text-sm">Total Forecast</h3>
          <p className="text-2xl font-semibold text-electric-cyan">
            {metric === 'revenue' ? formatCurrency(totalForecast) : formatNumber(totalForecast)}
          </p>
        </div>
        <div className="text-center">
          <h3 className="text-cloud-white text-sm">Growth Projection</h3>
          <p className={`text-2xl font-semibold ${growthProjection >= 0 ? 'text-electric-cyan' : 'text-signal-magenta'}`}>
            {formatPercentage(growthProjection)}
            {growthProjection >= 0 ? ' ↑' : ' ↓'}
          </p>
        </div>
        <div className="text-center">
          <h3 className="text-cloud-white text-sm">Average {horizon.charAt(0).toUpperCase() + horizon.slice(1)}ly Value</h3>
          <p className="text-2xl font-semibold text-electric-cyan">
            {metric === 'revenue' ? formatCurrency(averageDaily) : formatNumber(averageDaily)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForecastHorizonExplorer;