import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter, SeasonalPattern } from '../../types';

interface SeasonalPatternDetectorProps {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
}

interface SeasonalIndex {
  period: string;
  index: number;
  year: string;
}

const SeasonalPatternDetector: React.FC<SeasonalPatternDetectorProps> = ({
  horizon,
  metric,
  filters,
}) => {
  // Mock state for seasonality data
  const [seasonalHeatmap, setSeasonalHeatmap] = useState<any[]>([]);
  const [seasonalIndex, setSeasonalIndex] = useState<SeasonalIndex[]>([]);
  const [patternStrength, setPatternStrength] = useState<SeasonalPattern>({
    strength: 0,
    peakSeason: '',
    lowSeason: '',
    amplitude: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [timeGranularity, setTimeGranularity] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [yearRange, setYearRange] = useState<string>('Last 3 years');
  const [includeInForecast, setIncludeInForecast] = useState<boolean>(true);
  const [seasonalAdjustmentStrength, setSeasonalAdjustmentStrength] = useState<number>(100);

  // Generate mock data when parameters change
  useEffect(() => {
    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchData = () => {
      // Generate seasonal index data
      const seasonalIndexData: SeasonalIndex[] = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Create 3 years of monthly seasonal indices
      const years = ['2022', '2023', '2024'];
      
      // Define base seasonal pattern - higher in summer and winter (e.g. retail)
      const basePattern = [
        0.85, 0.80, 0.90, 0.95, 1.05, 1.10, 
        1.20, 1.15, 1.00, 0.95, 1.10, 1.30
      ];
      
      let maxIndex = 0;
      let minIndex = 2;
      let maxPeriod = '';
      let minPeriod = '';
      
      // Generate data for each year with slight variations
      years.forEach(year => {
        months.forEach((month, idx) => {
          // Base seasonal index with some random variation
          const variation = (Math.random() * 0.2) - 0.1; // -10% to +10%
          const index = basePattern[idx] + variation;
          
          // Track max/min
          if (index > maxIndex) {
            maxIndex = index;
            maxPeriod = `${month}`;
          }
          if (index < minIndex) {
            minIndex = index;
            minPeriod = `${month}`;
          }
          
          seasonalIndexData.push({
            period: month,
            index,
            year,
          });
        });
      });
      
      // Calculate seasonal pattern metrics
      const patternStats: SeasonalPattern = {
        strength: 0.75 + (Math.random() * 0.2), // 75-95%
        peakSeason: maxPeriod,
        lowSeason: minPeriod,
        amplitude: maxIndex / minIndex,
      };
      
      // Generate heatmap data (would be more complex in real implementation)
      // For now, we'll just use the seasonal index data
      
      setSeasonalIndex(seasonalIndexData);
      setPatternStrength(patternStats);
      setLoading(false);
    };
    
    // Simulate API delay
    setTimeout(fetchData, 500);
  }, [horizon, metric, filters, timeGranularity, yearRange]);

  // Custom tooltip for seasonal index chart
  const IndexTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-midnight-navy p-4 rounded-md shadow-lg border border-electric-cyan">
          <p className="text-cloud-white font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.payload.year} - {(entry.value).toFixed(2)}
            </p>
          ))}
          <p className="text-xs text-cloud-white opacity-70 mt-2">
            (1.0 = average demand)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-cloud-white">Seasonal Pattern Detector</h2>
        <div className="flex space-x-2">
          {/* Time granularity toggle */}
          <div className="flex rounded-full bg-midnight-navy p-1">
            {(['weekly', 'monthly', 'quarterly'] as const).map((gran) => (
              <button
                key={gran}
                className={`px-3 py-1 rounded-full transition-colors ${
                  timeGranularity === gran
                    ? 'bg-electric-cyan text-midnight-navy'
                    : 'text-cloud-white hover:bg-graphite'
                }`}
                onClick={() => setTimeGranularity(gran)}
              >
                {gran.charAt(0).toUpperCase() + gran.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Year range selector */}
          <select
            className="bg-midnight-navy text-cloud-white p-2 rounded-md"
            value={yearRange}
            onChange={(e) => setYearRange(e.target.value)}
          >
            <option value="Last 3 years">Last 3 years</option>
            <option value="Last 5 years">Last 5 years</option>
            <option value="All history">All history</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Seasonal index chart - takes 3 columns */}
        <div className="lg:col-span-3 bg-midnight-navy rounded-xl p-4 h-96">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-electric-cyan">Loading seasonal patterns...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={seasonalIndex}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" opacity={0.2} />
                <XAxis 
                  dataKey="period" 
                  stroke="#f7f9fb"
                  tick={{ fill: '#f7f9fb' }} 
                />
                <YAxis 
                  domain={[0.5, 1.5]} 
                  stroke="#f7f9fb" 
                  tick={{ fill: '#f7f9fb' }}
                  label={{ 
                    value: 'Seasonal Index', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#f7f9fb'
                  }}
                />
                <Tooltip content={<IndexTooltip />} />
                <Legend />
                
                {/* Average line at 1.0 */}
                <ReferenceLine 
                  y={1} 
                  stroke="#f7f9fb" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Average', 
                    position: 'right',
                    fill: '#f7f9fb',
                  }} 
                />
                
                {/* Lines for each year */}
                {(['2022', '2023', '2024'] as string[]).map((year, index) => (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey="index"
                    data={seasonalIndex.filter(d => d.year === year)}
                    name={year}
                    stroke={
                      index === 0 ? '#447799' : 
                      index === 1 ? '#5fd4d6' : 
                      '#00e0ff'
                    }
                    strokeWidth={year === '2024' ? 3 : 2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                ))}
                
                {/* Highlight peak and valley */}
                <ReferenceLine 
                  x={patternStrength.peakSeason} 
                  stroke="#e930ff" 
                  strokeWidth={2} 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Peak', 
                    position: 'top', 
                    fill: '#e930ff' 
                  }} 
                />
                <ReferenceLine 
                  x={patternStrength.lowSeason} 
                  stroke="#e930ff" 
                  strokeWidth={2} 
                  strokeDasharray="3 3"
                  label={{ 
                    value: 'Low', 
                    position: 'bottom', 
                    fill: '#e930ff' 
                  }}  
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pattern strength panel - takes 1 column */}
        <div className="bg-midnight-navy rounded-xl p-4 flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-cloud-white text-center">Seasonal Patterns</h3>
          
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-electric-cyan">Loading...</div>
            </div>
          ) : (
            <>
              {/* Pattern strength gauge */}
              <div className="mt-4">
                <p className="text-cloud-white text-sm mb-1">Pattern Strength</p>
                <div className="relative h-4 bg-midnight-navy border border-graphite rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-electric-cyan"
                    style={{ width: `${patternStrength.strength * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-cloud-white">Weak</span>
                  <span className="text-lg font-semibold text-electric-cyan">
                    {(patternStrength.strength * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-cloud-white">Strong</span>
                </div>
              </div>
              
              {/* Peak & Low seasons */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-cloud-white text-sm">Peak Season</p>
                  <p className="text-xl font-semibold text-electric-cyan">
                    {patternStrength.peakSeason}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-cloud-white text-sm">Low Season</p>
                  <p className="text-xl font-semibold text-electric-cyan">
                    {patternStrength.lowSeason}
                  </p>
                </div>
              </div>
              
              {/* Amplitude */}
              <div className="text-center">
                <p className="text-cloud-white text-sm">Amplitude (Peak/Low Ratio)</p>
                <p className="text-xl font-semibold text-electric-cyan">
                  {patternStrength.amplitude.toFixed(2)}x
                </p>
              </div>
              
              {/* Include in forecast toggle */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-cloud-white">Include in forecast</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={includeInForecast}
                    onChange={() => setIncludeInForecast(!includeInForecast)}
                  />
                  <div className="w-11 h-6 bg-midnight-navy peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-cyan"></div>
                </label>
              </div>
              
              {/* Seasonal adjustment strength */}
              {includeInForecast && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-cloud-white text-sm">Adjustment Strength</span>
                    <span className="text-electric-cyan">{seasonalAdjustmentStrength}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={seasonalAdjustmentStrength}
                    onChange={(e) => setSeasonalAdjustmentStrength(parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-xs text-cloud-white">
                    <span>None</span>
                    <span>Normal</span>
                    <span>Strong</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detected patterns list */}
      <div className="bg-midnight-navy rounded-xl p-4">
        <h3 className="text-lg font-semibold text-cloud-white mb-4">Detected Patterns</h3>
        
        {loading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="text-electric-cyan">Loading detected patterns...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-graphite rounded-lg p-3 border-l-4 border-electric-cyan">
              <h4 className="text-md font-semibold text-cloud-white">Winter Holiday Peak</h4>
              <div className="text-sm text-cloud-white opacity-80 mt-1">Strong end-of-year peak in December, 30-40% above average demand.</div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-electric-cyan">93% confidence</span>
                <button className="text-xs text-cloud-white hover:text-electric-cyan">Highlight</button>
              </div>
            </div>
            
            <div className="bg-graphite rounded-lg p-3 border-l-4 border-electric-cyan">
              <h4 className="text-md font-semibold text-cloud-white">Summer Sales Bump</h4>
              <div className="text-sm text-cloud-white opacity-80 mt-1">Increased activity in July-August, 15-20% above average demand.</div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-electric-cyan">87% confidence</span>
                <button className="text-xs text-cloud-white hover:text-electric-cyan">Highlight</button>
              </div>
            </div>
            
            <div className="bg-graphite rounded-lg p-3 border-l-4 border-signal-magenta">
              <h4 className="text-md font-semibold text-cloud-white">Spring Lull</h4>
              <div className="text-sm text-cloud-white opacity-80 mt-1">Consistent demand decrease in February-March, 15-20% below average.</div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-signal-magenta">78% confidence</span>
                <button className="text-xs text-cloud-white hover:text-electric-cyan">Highlight</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalPatternDetector;