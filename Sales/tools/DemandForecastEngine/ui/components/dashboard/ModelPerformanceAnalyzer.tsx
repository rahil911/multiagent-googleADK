import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, 
  BarChart, Bar, Cell, LineChart, Line
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { ForecastHorizon, ForecastMetric, DimensionFilter, ModelType, ModelPerformance } from '../../types';
import { formatCurrency, formatNumber, formatPercentage, getErrorColor } from '../../utils/chartHelpers';
import ChartWrapper from '../common/ChartWrapper';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import ModelPerformanceScatter from '../visualizations/ModelPerformanceScatter';
// Import the API directly for standalone use
import demandForecastAPI from '../../api/demandForecastApi';
import { selectModelPerformance } from '../../state/demandForecastSlice';

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
  modelType = 'movingAverage',
  onModelTypeChange = () => {/* No-op default handler */},
  horizon = 'month',
  metric = 'quantity', 
  filters = {},
  data: externalData,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const reduxData = useSelector(selectModelPerformance);
  
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
    // First priority: Use data passed directly as props
    if (externalData) {
      console.log("Using external prop data for Model Performance Analyzer");
      setModelMetrics(externalData);
      generateVisualizationData(externalData);
      return;
    }
    
    // Second priority: Use data from Redux store if available
    if (reduxData && reduxData.performance) {
      console.log("Using Redux data for Model Performance Analyzer", reduxData.performance);
      setModelMetrics(reduxData.performance);
      generateVisualizationData(reduxData.performance);
      return;
    }
    
    // Third priority: Fetch data directly with API call as fallback
    setLoading(true);
    console.log("No redux or prop data available, fetching from API directly");
    
    const fetchData = async () => {
      try {
        // Use the actual API function that generates mock data
        const performance = await demandForecastAPI.fetchModelPerformance(
          modelType,
          horizon,
          metric,
          filters
        );

        // If we got proper data back, use it
        if (performance) {
          console.log("Successfully loaded model performance data:", performance);
          setModelMetrics(performance);
          generateVisualizationData(performance);
        } else {
          console.error("No data returned from API");
          generateFallbackData();
        }
      } catch (error) {
        console.error("Error fetching model performance data:", error);
        generateFallbackData();
      }
    };

    fetchData();
  }, [modelType, horizon, metric, filters, externalData, reduxData]);

  // Generate the scatter, distribution and history data for visualizations
  const generateVisualizationData = (performance: ModelPerformance) => {
    // Generate scatter plot data (actual vs predicted)
    const scatterPoints: ScatterPoint[] = [];
    const errorCounts: {[key: string]: number} = {};
    
    // Use error metrics from the performance data to drive the visualization
    const errorFactor = performance.mape / 100; // Convert to ratio
    
    for (let i = 0; i < 30; i++) {
      const actual = 500 + Math.random() * 1500;
      
      // Add some randomness to the error but center around the known error rate
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
    
    // Generate performance history
    const history: ModelHistoryPoint[] = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Make the error improve over time (lower is better)
      const baseError = errorFactor - (i * 0.005);
      // Add some randomness
      const historyError = baseError + (Math.random() * 0.03 - 0.015);
      
      history.unshift({
        date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        error: historyError,
      });
    }
    
    setScatterData(scatterPoints);
    setErrorDistribution(errorDist);
    setHistoryData(history);
    setLoading(false);
  };
  
  // Original implementation as fallback
  const generateFallbackData = () => {
    console.log("Generating fallback mock data for Model Performance Analyzer");
    
    // Generate model metrics based on model type
    let baseError;
    switch(modelType) {
      case 'movingAverage':
        baseError = 500 + Math.random() * 200;
        break;
      case 'exponentialSmoothing':
        baseError = 400 + Math.random() * 150;
        break;
      case 'arima':
        baseError = 300 + Math.random() * 100;
        break;
      case 'machineLearning':
        baseError = 200 + Math.random() * 80;
        break;
      default:
        baseError = 500;
    }
    
    const fallbackMetrics = {
      mae: baseError,
      mse: baseError * baseError,
      rmse: Math.sqrt(baseError * baseError),
      mape: (baseError / 5000) * 100
    };
    
    setModelMetrics(fallbackMetrics);
    generateVisualizationData(fallbackMetrics);
  };

  // Format value for error distribution chart
  const formatError = (error: string) => {
    return error;
  };

  // Button styles for model selector
  const buttonStyle = (active: boolean) => ({
    flex: 1,
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

  // Smaller button style for secondary controls
  const smallButtonStyle = (active: boolean) => ({
    padding: '4px 10px',
    borderRadius: '16px',
    backgroundColor: theme.colors.electricCyan,
    color: theme.colors.midnight,
    border: 'none',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    margin: '0 2px',
    transition: 'all 0.2s ease'
  });

  // Create metric cards
  const MetricCard = ({ title, value, subtitle }: { title: string, value: string | number, subtitle?: string }) => (
    <div style={{
      backgroundColor: theme.colors.graphite,
      padding: `${theme.spacing[3]}px`,
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      height: '100%'
    }}>
      <div style={{
        color: theme.colors.cloudWhite,
        fontSize: theme.typography.fontSize.sm,
        marginBottom: '4px',
        opacity: 0.8
      }}>
        {title}
      </div>
      <div style={{
        color: theme.colors.electricCyan,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semiBold,
        margin: '2px 0'
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{
          color: theme.colors.cloudWhite,
          fontSize: theme.typography.fontSize.xs,
          opacity: 0.5
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  // Custom tooltip for error distribution chart
  const ErrorDistributionTooltip = ({ active, payload }: any) => {
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
            {data.bin} Error
          </p>
          <p style={{ 
            color: getErrorColor(data.errorMagnitude),
            margin: '4px 0',
            fontSize: theme.typography.fontSize.sm
          }}>
            Count: {data.count} instances
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for model history chart
  const HistoryTooltip = ({ active, payload }: any) => {
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
            {data.date}
          </p>
          <p style={{ 
            color: theme.colors.signalMagenta,
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

  return (
    <ChartWrapper
      title="Model Performance Analyzer"
      height={600}
      isLoading={loading}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '16px'
      }}>
        {/* Model type selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            color: theme.colors.cloudWhite,
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.medium
          }}>
            Forecast Model:
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button 
              style={buttonStyle(true)}
              onClick={() => onModelTypeChange('movingAverage')}
            >
              Moving Avg
            </button>
            <button 
              style={buttonStyle(true)}
              onClick={() => onModelTypeChange('exponentialSmoothing')}
            >
              Exp Smoothing
            </button>
            <button 
              style={buttonStyle(true)}
              onClick={() => onModelTypeChange('arima')}
            >
              ARIMA
            </button>
            <button 
              style={buttonStyle(true)}
              onClick={() => onModelTypeChange('machineLearning')}
            >
              ML
            </button>
          </div>
        </div>
        
        {/* KPI metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <MetricCard 
            title="MAPE" 
            value={`${modelMetrics.mape.toFixed(2)}%`}
            subtitle="Mean Absolute % Error" 
          />
          <MetricCard 
            title="MAE"
            value={metric === 'revenue' ? formatCurrency(modelMetrics.mae) : formatNumber(modelMetrics.mae)}
            subtitle="Mean Absolute Error"
          />
          <MetricCard 
            title="RMSE"
            value={metric === 'revenue' ? formatCurrency(modelMetrics.rmse) : formatNumber(modelMetrics.rmse)}
            subtitle="Root Mean Square Error"
          />
          <MetricCard 
            title="R²"
            value={`${(0.95 - (modelMetrics.mape / 200)).toFixed(2)}`}
            subtitle="Coefficient of Determination"
          />
        </div>
        
        {/* Main charts - 2 column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          flex: 1,
          minHeight: 250 // Ensure minimum height for the chart containers
        }}>
          {/* Actual vs Predicted Scatter Plot */}
          <div style={{ height: '100%' }}>
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                color: theme.colors.cloudWhite,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                marginBottom: '8px'
              }}>
                Actual vs. Predicted
              </div>
              <div style={{ 
                flex: 1, 
                minHeight: 200, // Ensure the chart has enough vertical space
                position: 'relative' // Establish positioning context
              }}>
                <ModelPerformanceScatter 
                  data={scatterData} 
                  metric={metric}
                  height="100%"
                />
              </div>
            </div>
          </div>
          
          {/* Error Distribution Chart */}
          <div style={{ height: '100%' }}>
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                color: theme.colors.cloudWhite,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Error Distribution</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    style={smallButtonStyle(true)}
                    onClick={() => setValidationPeriod('Last 12 periods')}
                  >
                    12 Periods
                  </button>
                  <button
                    style={smallButtonStyle(true)}
                    onClick={() => setValidationPeriod('Last 24 periods')}
                  >
                    24 Periods
                  </button>
                  <button
                    style={smallButtonStyle(true)}
                    onClick={() => setValidationPeriod('All periods')}
                  >
                    All Periods
                  </button>
                </div>
              </div>
              
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={errorDistribution}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={`${theme.colors.graphiteDark}33`} />
                    <XAxis 
                      dataKey="bin" 
                      tickFormatter={formatError}
                      tick={{ fill: theme.colors.cloudWhite, fontSize: 10 }}
                      stroke={theme.colors.cloudWhite}
                    />
                    <YAxis 
                      tick={{ fill: theme.colors.cloudWhite, fontSize: 10 }}
                      stroke={theme.colors.cloudWhite}
                    />
                    <Tooltip content={<ErrorDistributionTooltip />} />
                    <Bar dataKey="count" name="Error Distribution">
                      {errorDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getErrorColor(entry.errorMagnitude)} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        {/* Model performance history */}
        <div style={{
          marginTop: '16px'
        }}>
          <div style={{
            color: theme.colors.cloudWhite,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            marginBottom: '8px'
          }}>
            Model Performance History (MAPE)
          </div>
          <div style={{ height: '120px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historyData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={`${theme.colors.graphiteDark}33`} />
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
                <Tooltip content={<HistoryTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="error" 
                  stroke={theme.colors.signalMagenta} 
                  strokeWidth={2}
                  dot={{ r: 3, fill: theme.colors.signalMagenta }}
                  activeDot={{ r: 5, fill: theme.colors.signalMagenta }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ChartWrapper>
  );
};

export default ModelPerformanceAnalyzer;