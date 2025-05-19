import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, 
  BarChart, Bar, Cell, LineChart, Line
} from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter, ModelType, ModelPerformance } from '../../types';
import { formatCurrency, formatNumber, formatPercentage, getErrorColor } from '../../utils/chartHelpers';
import ChartWrapper from '../common/ChartWrapper';
import { useTheme } from '../../../../../../ui-common/design-system/theme';

interface ModelPerformanceAnalyzerProps {
  modelType: ModelType;
  onModelTypeChange: (model: ModelType) => void;
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
  data?: ModelPerformance;
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
  data: externalData,
}) => {
  const theme = useTheme();
  
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
    if (externalData) {
      setModelMetrics(externalData);
      setLoading(false);
      return;
    }
    
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
  }, [modelType, horizon, metric, filters, validationPeriod, externalData]);

  // Custom tooltip for scatter plot
  const ScatterTooltip = ({ active, payload }: any) => {
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
            Actual: {metric === 'revenue' ? formatCurrency(data.actual) : formatNumber(data.actual)}
          </p>
          <p style={{ 
            color: theme.colors.signalMagenta,
            margin: '4px 0',
            fontSize: theme.typography.fontSize.sm
          }}>
            Predicted: {metric === 'revenue' ? formatCurrency(data.predicted) : formatNumber(data.predicted)}
          </p>
          <p style={{ 
            color: getErrorColor(data.errorMagnitude),
            margin: '4px 0',
            fontSize: theme.typography.fontSize.sm
          }}>
            Error: {formatPercentage(data.error)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Button styles for model selector
  const buttonStyle = (active: boolean) => ({
    flex: 1,
    padding: '8px 16px',
    borderRadius: '24px',
    backgroundColor: active ? theme.colors.electricCyan : theme.colors.midnight,
    color: active ? theme.colors.midnight : theme.colors.cloudWhite,
    border: 'none',
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.sm,
  });

  // Chart actions
  const actions = (
    <div style={{ display: 'flex' }}>
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
  );

  // Metric Card component for displaying model metrics
  const MetricCard = ({ title, value, subtitle }: { title: string, value: string | number, subtitle?: string }) => (
    <div style={{
      backgroundColor: theme.colors.midnight,
      borderRadius: '8px',
      padding: theme.spacing[3],
      marginBottom: theme.spacing[2]
    }}>
      <div style={{ 
        color: theme.colors.cloudWhite, 
        fontSize: theme.typography.fontSize.xs,
        opacity: 0.7,
        marginBottom: '4px'
      }}>
        {title}
      </div>
      <div style={{ 
        color: theme.colors.electricCyan, 
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.semiBold
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ 
          color: theme.colors.cloudWhite, 
          fontSize: theme.typography.fontSize.xs,
          opacity: 0.7,
          marginTop: '4px'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  return (
    <ChartWrapper
      title="Model Performance Analyzer"
      isLoading={loading}
      height={560}
      actions={actions}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
        {/* Model selector */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: theme.colors.midnight, 
          borderRadius: '24px', 
          padding: '4px'
        }}>
          {([
            { id: 'movingAverage', label: 'Moving Average' },
            { id: 'exponentialSmoothing', label: 'Exp. Smoothing' },
            { id: 'arima', label: 'ARIMA' },
            { id: 'machineLearning', label: 'Machine Learning' },
          ] as { id: ModelType, label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              style={buttonStyle(modelType === id)}
              onClick={() => onModelTypeChange(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', height: 'calc(100% - 50px)', gap: '16px' }}>
          {/* Main charts section */}
          <div style={{ flex: 1 }}>
            {/* Scatter plot: Actual vs Predicted */}
            <div style={{ height: '65%', marginBottom: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={`${theme.colors.graphiteDark}33`} />
                  <XAxis 
                    type="number" 
                    dataKey="actual" 
                    name="Actual" 
                    tick={{ fill: theme.colors.cloudWhite }}
                    stroke={theme.colors.cloudWhite}
                    label={{
                      value: 'Actual',
                      position: 'insideBottomRight',
                      offset: -10,
                      fill: theme.colors.cloudWhite,
                    }}
                    tickFormatter={(value) => metric === 'revenue' ? `$${(value/1000).toFixed(0)}K` : `${(value/1000).toFixed(0)}K`}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="predicted" 
                    name="Predicted" 
                    tick={{ fill: theme.colors.cloudWhite }}
                    stroke={theme.colors.cloudWhite}
                    label={{
                      value: 'Predicted',
                      angle: -90,
                      position: 'insideLeft',
                      fill: theme.colors.cloudWhite,
                    }}
                    tickFormatter={(value) => metric === 'revenue' ? `$${(value/1000).toFixed(0)}K` : `${(value/1000).toFixed(0)}K`}
                  />
                  <ZAxis range={[60, 60]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
                  
                  {/* Perfect prediction reference line */}
                  <ReferenceLine 
                    segment={[
                      { x: 0, y: 0 },
                      { x: 3000, y: 3000 }
                    ]} 
                    stroke={theme.colors.cloudWhite}
                    strokeDasharray="5 5"
                  />
                  
                  {/* 5% error bands */}
                  <ReferenceLine 
                    segment={[
                      { x: 0, y: 0 },
                      { x: 3000, y: 3150 }
                    ]} 
                    stroke={theme.colors.cloudWhite}
                    strokeDasharray="3 3"
                    strokeOpacity={0.3}
                  />
                  <ReferenceLine 
                    segment={[
                      { x: 0, y: 0 },
                      { x: 3000, y: 2850 }
                    ]} 
                    stroke={theme.colors.cloudWhite}
                    strokeDasharray="3 3"
                    strokeOpacity={0.3}
                  />
                  
                  <Scatter 
                    name="Forecast Error" 
                    data={scatterData} 
                    shape="circle"
                  >
                    {scatterData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getErrorColor(entry.errorMagnitude)} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            {/* Error Distribution Histogram */}
            <div style={{ height: '35%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={errorDistribution}
                  margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={`${theme.colors.graphiteDark}33`} 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="bin" 
                    tick={{ fill: theme.colors.cloudWhite }}
                    stroke={theme.colors.cloudWhite}
                    label={{
                      value: 'Error Percentage',
                      position: 'insideBottom',
                      offset: -10,
                      fill: theme.colors.cloudWhite,
                    }}
                  />
                  <YAxis 
                    tick={{ fill: theme.colors.cloudWhite }}
                    stroke={theme.colors.cloudWhite}
                    label={{
                      value: 'Frequency',
                      angle: -90,
                      position: 'insideLeft',
                      fill: theme.colors.cloudWhite,
                    }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} occurrences`, 'Frequency']}
                    labelFormatter={(label) => `Error: ${label}`}
                    contentStyle={{
                      backgroundColor: theme.colors.midnight,
                      border: `1px solid ${theme.colors.electricCyan}`,
                      borderRadius: '4px',
                      color: theme.colors.cloudWhite,
                    }}
                  />
                  <Bar dataKey="count" name="Error Frequency">
                    {errorDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getErrorColor(entry.errorMagnitude)} 
                      />
                    ))}
                  </Bar>
                  
                  {/* Average error reference line */}
                  <ReferenceLine
                    x="8%"
                    stroke={theme.colors.signalMagenta}
                    label={{
                      value: 'Avg Error',
                      fill: theme.colors.signalMagenta,
                      position: 'top',
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Metrics Panel */}
          <div style={{ width: '220px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ 
                color: theme.colors.cloudWhite, 
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semiBold,
                marginBottom: '12px'
              }}>
                Model Metrics
              </h3>
              
              <MetricCard 
                title="Mean Absolute Error" 
                value={formatNumber(modelMetrics.mae)} 
              />
              
              <MetricCard 
                title="Root Mean Square Error" 
                value={formatNumber(modelMetrics.rmse)} 
              />
              
              <MetricCard 
                title="Mean Absolute % Error" 
                value={formatPercentage(modelMetrics.mape / 100)} 
              />
            </div>
            
            {/* Performance History */}
            <div>
              <h3 style={{ 
                color: theme.colors.cloudWhite, 
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semiBold,
                marginBottom: '12px'
              }}>
                Error Trend
              </h3>
              
              <div style={{ height: '100px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historyData}
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                  >
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: theme.colors.cloudWhite, fontSize: 10 }}
                      stroke={theme.colors.cloudWhite}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      tick={{ fill: theme.colors.cloudWhite, fontSize: 10 }}
                      stroke={theme.colors.cloudWhite}
                    />
                    <Tooltip 
                      formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Error']}
                      contentStyle={{
                        backgroundColor: theme.colors.midnight,
                        border: `1px solid ${theme.colors.electricCyan}`,
                        borderRadius: '4px',
                        color: theme.colors.cloudWhite,
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="error" 
                      stroke={theme.colors.electricCyan} 
                      strokeWidth={2}
                      dot={{ r: 3, fill: theme.colors.electricCyan }}
                      activeDot={{ r: 5, fill: theme.colors.electricCyan }}
                    />
                    
                    {/* Trend line */}
                    <ReferenceLine 
                      y={historyData[0]?.error} 
                      stroke={theme.colors.electricCyan}
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChartWrapper>
  );
};

export default ModelPerformanceAnalyzer;