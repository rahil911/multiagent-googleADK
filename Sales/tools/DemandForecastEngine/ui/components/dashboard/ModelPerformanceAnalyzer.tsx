import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, 
  BarChart, Bar, Cell, LineChart, Line
} from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter, ModelType, ModelPerformance } from '../../types';

interface ModelPerformanceAnalyzerProps {
  modelType: ModelType;
  onModelTypeChange: (model: ModelType) => void;
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
}

interface ScatterPoint {
  actual: number;
  predicted: number;
  period: string;
  error: number;
  errorMagnitude: 'low' | 'medium' | 'high';
}

interface ErrorDistribution {
  bin: string;
  count: number;
  errorMagnitude: 'low' | 'medium' | 'high';
}

interface ModelHistoryPoint {
  date: string;
  error: number;
}

const ModelPerformanceAnalyzer: React.FC<ModelPerformanceAnalyzerProps> = ({
  modelType,
  onModelTypeChange,
  horizon,
  metric,
  filters,
}) => {
  // Mock state for model data
  const [scatterData, setScatterData] = useState<ScatterPoint[]>([]);
  const [errorDistribution, setErrorDistribution] = useState<ErrorDistribution[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelPerformance>({
    mae: 0,
    mse: 0,
    rmse: 0,
    mape: 0,
  });
  const [historyData, setHistoryData] = useState<ModelHistoryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [validationPeriod, setValidationPeriod] = useState<string>('Last 12 periods');

  // Generate mock data when parameters change
  useEffect(() => {
    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchData = () => {
      // Generate scatter plot data (actual vs predicted)
      const scatterPoints: ScatterPoint[] = [];
      const errorCounts: {[key: string]: number} = {};
      
      for (let i = 0; i < 30; i++) {
        const actual = 500 + Math.random() * 1500;
        
        // Error varies by model type
        let errorFactor;
        switch(modelType) {
          case 'movingAverage':
            errorFactor = 0.15;
            break;
          case 'exponentialSmoothing':
            errorFactor = 0.12;
            break;
          case 'arima':
            errorFactor = 0.1;
            break;
          case 'machineLearning':
            errorFactor = 0.08;
            break;
          default:
            errorFactor = 0.15;
        }
        
        // Add some randomness to the error
        const errorPct = (Math.random() * errorFactor * 2) - errorFactor;
        const predicted = actual * (1 + errorPct);
        const error = Math.abs((predicted - actual) / actual);
        
        // Categorize error magnitude
        let errorMagnitude: 'low' | 'medium' | 'high';
        if (error < 0.05) {
          errorMagnitude = 'low';
        } else if (error < 0.1) {
          errorMagnitude = 'medium';
        } else {
          errorMagnitude = 'high';
        }
        
        // Create date for this point
        const date = new Date();
        date.setDate(date.getDate() - (30 - i));
        
        scatterPoints.push({
          actual,
          predicted,
          period: date.toISOString().split('T')[0],
          error,
          errorMagnitude,
        });
        
        // Track error distribution
        const errorBin = Math.floor(error * 100 / 2) * 2; // Group into 2% bins
        const binKey = `${errorBin}%`;
        errorCounts[binKey] = (errorCounts[binKey] || 0) + 1;
      }
      
      // Convert error counts to distribution data
      const errorDist: ErrorDistribution[] = Object.keys(errorCounts).map(bin => {
        const error = parseInt(bin) / 100;
        let errorMagnitude: 'low' | 'medium' | 'high';
        if (error < 0.05) {
          errorMagnitude = 'low';
        } else if (error < 0.1) {
          errorMagnitude = 'medium';
        } else {
          errorMagnitude = 'high';
        }
        
        return {
          bin,
          count: errorCounts[bin],
          errorMagnitude,
        };
      }).sort((a, b) => parseInt(a.bin) - parseInt(b.bin));
      
      // Calculate model metrics
      const errors = scatterPoints.map(point => Math.abs(point.actual - point.predicted));
      const squaredErrors = errors.map(err => err * err);
      const percentageErrors = scatterPoints.map(point => 
        Math.abs((point.actual - point.predicted) / point.actual)
      );
      
      const mae = errors.reduce((sum, err) => sum + err, 0) / errors.length;
      const mse = squaredErrors.reduce((sum, err) => sum + err, 0) / squaredErrors.length;
      const rmse = Math.sqrt(mse);
      const mape = percentageErrors.reduce((sum, err) => sum + err, 0) / percentageErrors.length * 100;
      
      // Generate performance history
      const history: ModelHistoryPoint[] = [];
      for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        // Make the error improve over time (lower is better)
        const baseError = 0.15 - (i * 0.005);
        // Add some randomness
        const error = baseError + (Math.random() * 0.03 - 0.015);
        
        history.unshift({
          date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
          error: error,
        });
      }
      
      setScatterData(scatterPoints);
      setErrorDistribution(errorDist);
      setModelMetrics({
        mae,
        mse,
        rmse,
        mape,
      });
      setHistoryData(history);
      setLoading(false);
    };
    
    // Simulate API delay
    setTimeout(fetchData, 500);
  }, [modelType, horizon, metric, filters, validationPeriod]);

  // Custom tooltip for scatter plot
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-midnight-navy p-4 rounded-md shadow-lg border border-electric-cyan">
          <p className="text-cloud-white font-semibold">{data.period}</p>
          <p className="text-electric-cyan">
            Actual: {metric === 'revenue' ? '$' : ''}{Math.round(data.actual)}
          </p>
          <p className="text-signal-magenta">
            Predicted: {metric === 'revenue' ? '$' : ''}{Math.round(data.predicted)}
          </p>
          <p className={`text-${data.errorMagnitude === 'low' ? 'electric-cyan' : data.errorMagnitude === 'medium' ? 'blue-400' : 'signal-magenta'}`}>
            Error: {(data.error * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Get color based on error magnitude
  const getErrorColor = (errorMagnitude: 'low' | 'medium' | 'high') => {
    switch (errorMagnitude) {
      case 'low':
        return '#00e0ff'; // Electric Cyan
      case 'medium':
        return '#5fd4d6'; // Lighter cyan
      case 'high':
        return '#e930ff'; // Signal Magenta
      default:
        return '#00e0ff';
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-cloud-white">Model Performance Analyzer</h2>
        <div className="flex space-x-2">
          <select
            className="bg-midnight-navy text-cloud-white p-2 rounded-md"
            value={validationPeriod}
            onChange={(e) => setValidationPeriod(e.target.value)}
          >
            <option value="Last 12 periods">Last 12 periods</option>
            <option value="Last 30 periods">Last 30 periods</option>
            <option value="Last 90 periods">Last 90 periods</option>
            <option value="Last year">Last year</option>
            <option value="Custom">Custom...</option>
          </select>
        </div>
      </div>

      {/* Model selector */}
      <div className="flex rounded-full bg-midnight-navy p-1">
        {([
          { id: 'movingAverage', label: 'Moving Average' },
          { id: 'exponentialSmoothing', label: 'Exp. Smoothing' },
          { id: 'arima', label: 'ARIMA' },
          { id: 'machineLearning', label: 'Machine Learning' },
        ] as { id: ModelType, label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            className={`flex-1 px-3 py-1 rounded-full transition-colors ${
              modelType === id
                ? 'bg-electric-cyan text-midnight-navy'
                : 'text-cloud-white hover:bg-graphite'
            }`}
            onClick={() => onModelTypeChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Scatter plot - takes 3 columns */}
        <div className="lg:col-span-3 bg-midnight-navy rounded-xl p-4 h-96">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-electric-cyan">Loading performance data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" opacity={0.2} />
                <XAxis 
                  type="number" 
                  dataKey="actual" 
                  name="Actual" 
                  stroke="#f7f9fb"
                  tick={{ fill: '#f7f9fb' }} 
                  label={{ 
                    value: 'Actual', 
                    position: 'insideBottom', 
                    offset: -10,
                    fill: '#f7f9fb'
                  }}
                />
                <YAxis 
                  type="number" 
                  dataKey="predicted" 
                  name="Predicted" 
                  stroke="#f7f9fb" 
                  tick={{ fill: '#f7f9fb' }}
                  label={{ 
                    value: 'Predicted', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#f7f9fb'
                  }}
                />
                <ZAxis range={[100, 100]} />
                <Tooltip content={<ScatterTooltip />} />
                
                {/* Perfect prediction line */}
                <ReferenceLine 
                  y="actual" 
                  stroke="#f7f9fb" 
                  strokeDasharray="3 3" 
                />
                
                {/* Error bands */}
                <ReferenceLine 
                  y={d => d.actual * 1.05} 
                  stroke="#f7f9fb" 
                  strokeOpacity={0.3} 
                  strokeDasharray="3 3" 
                />
                <ReferenceLine 
                  y={d => d.actual * 0.95} 
                  stroke="#f7f9fb" 
                  strokeOpacity={0.3} 
                  strokeDasharray="3 3" 
                />
                <ReferenceLine 
                  y={d => d.actual * 1.1} 
                  stroke="#f7f9fb" 
                  strokeOpacity={0.2} 
                  strokeDasharray="3 3" 
                />
                <ReferenceLine 
                  y={d => d.actual * 0.9} 
                  stroke="#f7f9fb" 
                  strokeOpacity={0.2} 
                  strokeDasharray="3 3" 
                />
                <ReferenceLine 
                  y={d => d.actual * 1.2} 
                  stroke="#f7f9fb" 
                  strokeOpacity={0.1} 
                  strokeDasharray="3 3" 
                />
                <ReferenceLine 
                  y={d => d.actual * 0.8} 
                  stroke="#f7f9fb" 
                  strokeOpacity={0.1} 
                  strokeDasharray="3 3" 
                />
                
                <Scatter 
                  name="Prediction Accuracy" 
                  data={scatterData} 
                  fill="#00e0ff"
                  shape={(props) => {
                    const { cx, cy } = props;
                    const point = props.payload as ScatterPoint;
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={8} 
                        fill={getErrorColor(point.errorMagnitude)} 
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Metrics panel - takes 1 column */}
        <div className="bg-midnight-navy rounded-xl p-4 flex flex-col space-y-4">
          <h3 className="text-lg font-semibold text-cloud-white text-center">Model Performance</h3>
          
          <div className="flex flex-col space-y-4 mt-4">
            <div className="text-center">
              <p className="text-cloud-white text-sm">MAE</p>
              <p className="text-2xl font-semibold text-electric-cyan">
                {loading ? '-' : Math.round(modelMetrics.mae)}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-cloud-white text-sm">RMSE</p>
              <p className="text-2xl font-semibold text-electric-cyan">
                {loading ? '-' : Math.round(modelMetrics.rmse)}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-cloud-white text-sm">MAPE</p>
              <p className="text-2xl font-semibold text-electric-cyan">
                {loading ? '-' : modelMetrics.mape.toFixed(1)}%
              </p>
            </div>
          </div>
          
          {/* Performance history mini chart */}
          <div className="h-24 mt-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-electric-cyan text-xs">Loading...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#f7f9fb', fontSize: 9 }} 
                    stroke="#f7f9fb"
                    height={15}
                    tickMargin={2}
                  />
                  <YAxis 
                    hide
                    domain={[
                      Math.min(...historyData.map(d => d.error)) * 0.9,
                      Math.max(...historyData.map(d => d.error)) * 1.1
                    ]}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Error']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="error"
                    stroke="#00e0ff"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                  />
                  {/* Trend line */}
                  <Line
                    type="linear"
                    dataKey="error"
                    stroke="#f7f9fb"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Error distribution histogram */}
      <div className="h-32 bg-midnight-navy rounded-xl p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-electric-cyan">Loading error distribution...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={errorDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" opacity={0.2} vertical={false} />
              <XAxis 
                dataKey="bin" 
                tick={{ fill: '#f7f9fb' }} 
                stroke="#f7f9fb"
                label={{ 
                  value: 'Error Percentage', 
                  position: 'insideBottom', 
                  offset: -5,
                  fill: '#f7f9fb',
                  fontSize: 10
                }}
              />
              <YAxis 
                tick={{ fill: '#f7f9fb' }} 
                stroke="#f7f9fb"
                label={{ 
                  value: 'Count', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: '#f7f9fb',
                  fontSize: 10
                }}
              />
              <Tooltip 
                formatter={(value: any) => [value, 'Count']}
                labelFormatter={(label) => `Error: ${label}`}
              />
              <Bar dataKey="count" name="Count">
                {errorDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getErrorColor(entry.errorMagnitude)} />
                ))}
              </Bar>
              
              {/* Average error line */}
              <ReferenceLine 
                x={Math.floor(modelMetrics.mape / 2) * 2 + '%'} 
                stroke="#f7f9fb" 
                strokeWidth={2} 
                label={{ 
                  value: 'Avg', 
                  position: 'top', 
                  fill: '#f7f9fb',
                  fontSize: 10
                }} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ModelPerformanceAnalyzer;