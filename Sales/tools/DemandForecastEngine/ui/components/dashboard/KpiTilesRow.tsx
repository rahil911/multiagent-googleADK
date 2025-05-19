import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ForecastHorizon, ForecastMetric, DimensionFilter } from '../../types';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/chartHelpers';

interface KpiTilesRowProps {
  forecastHorizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
}

interface KpiData {
  forecastVolume: {
    value: number;
    target: number;
    status: 'above' | 'on' | 'below';
  };
  forecastRevenue: {
    value: number;
    growth: number;
    trend: number[];
    status: 'growth' | 'decline' | 'flat';
  };
  forecastAccuracy: {
    value: number;
    stars: number;
    status: 'high' | 'medium' | 'low';
  };
  demandTrend: {
    direction: 'increasing' | 'stable' | 'decreasing' | 'volatile';
    slope: number;
  };
  seasonalImpact: {
    value: number;
    status: 'strong' | 'moderate' | 'weak';
  };
}

const KpiTilesRow: React.FC<KpiTilesRowProps> = ({
  forecastHorizon,
  metric,
  filters,
}) => {
  const [kpiData, setKpiData] = useState<KpiData>({
    forecastVolume: {
      value: 0,
      target: 0,
      status: 'on',
    },
    forecastRevenue: {
      value: 0,
      growth: 0,
      trend: [],
      status: 'flat',
    },
    forecastAccuracy: {
      value: 0,
      stars: 0,
      status: 'medium',
    },
    demandTrend: {
      direction: 'stable',
      slope: 0,
    },
    seasonalImpact: {
      value: 0,
      status: 'moderate',
    },
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Simulate fetching KPI data
  useEffect(() => {
    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchData = () => {
      // Generate mock KPI data based on selected parameters
      const volumeValue = 15000 + Math.random() * 5000;
      const volumeTarget = 18000;
      const volumeStatus = volumeValue > volumeTarget * 1.05 
        ? 'above' 
        : volumeValue < volumeTarget * 0.95 
          ? 'below' 
          : 'on';
      
      const revenueValue = volumeValue * (metric === 'revenue' ? 10 : 1);
      const revenueGrowth = (Math.random() * 0.3) - 0.1; // -10% to +20%
      const revenueTrend = Array.from({ length: 10 }, () => 
        1000 + Math.random() * 500
      );
      const revenueStatus = revenueGrowth > 0.03 
        ? 'growth' 
        : revenueGrowth < -0.03 
          ? 'decline' 
          : 'flat';
      
      const accuracyValue = 0.7 + Math.random() * 0.25; // 70-95%
      const accuracyStars = Math.round(accuracyValue * 5);
      const accuracyStatus = accuracyValue > 0.9 
        ? 'high' 
        : accuracyValue > 0.7 
          ? 'medium' 
          : 'low';
      
      const trendDirections = ['increasing', 'stable', 'decreasing', 'volatile'] as const;
      const trendDirection = trendDirections[Math.floor(Math.random() * 4)];
      const trendSlope = trendDirection === 'increasing' 
        ? 0.1 + Math.random() * 0.2 
        : trendDirection === 'decreasing' 
          ? -0.1 - Math.random() * 0.2 
          : trendDirection === 'stable' 
            ? Math.random() * 0.05 - 0.025 
            : Math.random() * 0.4 - 0.2;
      
      const seasonalValue = Math.random();
      const seasonalStatus = seasonalValue > 0.66 
        ? 'strong' 
        : seasonalValue > 0.33 
          ? 'moderate' 
          : 'weak';
      
      setKpiData({
        forecastVolume: {
          value: volumeValue,
          target: volumeTarget,
          status: volumeStatus,
        },
        forecastRevenue: {
          value: revenueValue,
          growth: revenueGrowth,
          trend: revenueTrend,
          status: revenueStatus,
        },
        forecastAccuracy: {
          value: accuracyValue,
          stars: accuracyStars,
          status: accuracyStatus,
        },
        demandTrend: {
          direction: trendDirection,
          slope: trendSlope,
        },
        seasonalImpact: {
          value: seasonalValue,
          status: seasonalStatus,
        },
      });
      
      setLoading(false);
    };
    
    // Simulate API delay
    setTimeout(fetchData, 500);
  }, [forecastHorizon, metric, filters]);

  // Generate sparkline data
  const sparklineData = kpiData.forecastRevenue.trend.map((value, index) => ({
    name: index,
    value,
  }));

  // Render star rating
  const StarRating = ({ stars }: { stars: number }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg 
            key={i} 
            className={`w-4 h-4 ${i <= stars ? 'text-electric-cyan' : 'text-graphite'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Render trend arrow
  const TrendArrow = ({ direction, slope }: { direction: string, slope: number }) => {
    let rotation = 0;
    let color = '';
    
    switch (direction) {
      case 'increasing':
        rotation = -45;
        color = 'text-electric-cyan';
        break;
      case 'decreasing':
        rotation = 45;
        color = 'text-signal-magenta';
        break;
      case 'stable':
        rotation = 0;
        color = 'text-cloud-white';
        break;
      case 'volatile':
        rotation = 0;
        color = 'text-yellow-400';
        break;
    }
    
    // For volatile, use a different icon
    if (direction === 'volatile') {
      return (
        <svg className={`w-8 h-8 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    
    return (
      <svg 
        className={`w-8 h-8 ${color} transform`} 
        style={{ transform: `rotate(${rotation}deg)` }}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    );
  };

  // Render seasonality wave
  const SeasonalityWave = ({ strength }: { strength: number }) => {
    // The wave amplitude and frequency varies based on strength
    const amplitude = strength * 20;
    
    return (
      <svg className="w-16 h-8" viewBox="0 0 100 40">
        <path
          d={`M0,20 Q25,${20-amplitude} 50,20 T100,20 M0,20 Q25,${20+amplitude} 50,20 T100,20`}
          fill="none"
          stroke="#00e0ff"
          strokeWidth="2"
        />
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Total Forecast Volume */}
      <div className="bg-graphite rounded-xl p-4 flex flex-col justify-between h-32">
        <div className="text-cloud-white text-sm">Total Forecast Volume</div>
        <div className="text-center my-auto">
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-8 w-24 mx-auto rounded"></div>
          ) : (
            <div className="text-3xl font-semibold text-cloud-white">
              {metric === 'quantity' ? formatNumber(kpiData.forecastVolume.value) : formatNumber(kpiData.forecastVolume.value / 10)}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-cloud-white opacity-70">{forecastHorizon}</span>
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-3 w-16 rounded"></div>
          ) : (
            <div className={`
              px-2 py-0.5 rounded-full 
              ${kpiData.forecastVolume.status === 'above' ? 'bg-green-900 text-green-300' : 
                kpiData.forecastVolume.status === 'below' ? 'bg-red-900 text-red-300' : 
                'bg-blue-900 text-blue-300'}
            `}>
              {kpiData.forecastVolume.status === 'above' ? 'Above Target' : 
               kpiData.forecastVolume.status === 'below' ? 'Below Target' : 
               'On Target'}
            </div>
          )}
        </div>
      </div>
      
      {/* Forecast Revenue */}
      <div className="bg-graphite rounded-xl p-4 flex flex-col justify-between h-32">
        <div className="text-cloud-white text-sm">Forecast Revenue</div>
        <div className="text-center">
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-8 w-24 mx-auto rounded"></div>
          ) : (
            <div className="text-3xl font-semibold text-cloud-white">
              {formatCurrency(kpiData.forecastRevenue.value)}
            </div>
          )}
        </div>
        {loading ? (
          <div className="animate-pulse bg-midnight-navy h-3 w-full rounded"></div>
        ) : (
          <div className="h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={kpiData.forecastRevenue.status === 'growth' ? '#00e0ff' : 
                         kpiData.forecastRevenue.status === 'decline' ? '#e930ff' : 
                         '#f7f9fb'}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex justify-center text-xs mt-1">
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-3 w-16 rounded"></div>
          ) : (
            <div className={`
              ${kpiData.forecastRevenue.growth > 0 ? 'text-electric-cyan' : 
                kpiData.forecastRevenue.growth < 0 ? 'text-signal-magenta' : 
                'text-cloud-white'}
            `}>
              {kpiData.forecastRevenue.growth > 0 ? '+' : ''}
              {formatPercentage(kpiData.forecastRevenue.growth)}
              {kpiData.forecastRevenue.growth > 0 ? ' ↑' : 
               kpiData.forecastRevenue.growth < 0 ? ' ↓' : ' →'}
            </div>
          )}
        </div>
      </div>
      
      {/* Forecast Accuracy */}
      <div className="bg-graphite rounded-xl p-4 flex flex-col justify-between h-32">
        <div className="text-cloud-white text-sm">Forecast Accuracy</div>
        <div className="text-center">
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-8 w-16 mx-auto rounded"></div>
          ) : (
            <div className="text-3xl font-semibold text-cloud-white">
              {formatPercentage(kpiData.forecastAccuracy.value)}
            </div>
          )}
        </div>
        <div className="text-xs text-cloud-white opacity-70 text-center">Model Accuracy</div>
        <div className="flex justify-center mt-1">
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-4 w-20 rounded"></div>
          ) : (
            <StarRating stars={kpiData.forecastAccuracy.stars} />
          )}
        </div>
      </div>
      
      {/* Demand Trend */}
      <div className="bg-graphite rounded-xl p-4 flex flex-col justify-between h-32">
        <div className="text-cloud-white text-sm">Demand Trend</div>
        <div className="flex justify-center items-center h-16">
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-12 w-12 mx-auto rounded-full"></div>
          ) : (
            <TrendArrow 
              direction={kpiData.demandTrend.direction} 
              slope={kpiData.demandTrend.slope} 
            />
          )}
        </div>
        <div className="text-center">
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-5 w-20 mx-auto rounded"></div>
          ) : (
            <div className="text-base font-semibold text-cloud-white capitalize">
              {kpiData.demandTrend.direction}
            </div>
          )}
        </div>
        <div className="text-xs text-cloud-white opacity-70 text-center">Long-term Trend</div>
      </div>
      
      {/* Seasonal Impact */}
      <div className="bg-graphite rounded-xl p-4 flex flex-col justify-between h-32">
        <div className="text-cloud-white text-sm">Seasonal Impact</div>
        <div className="text-center">
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-8 w-16 mx-auto rounded"></div>
          ) : (
            <div className="text-3xl font-semibold text-cloud-white">
              {formatPercentage(kpiData.seasonalImpact.value)}
            </div>
          )}
        </div>
        <div className="flex justify-center">
          {loading ? (
            <div className="animate-pulse bg-midnight-navy h-8 w-16 mx-auto rounded"></div>
          ) : (
            <SeasonalityWave strength={kpiData.seasonalImpact.value} />
          )}
        </div>
        <div className="text-xs text-cloud-white opacity-70 text-center">Seasonal Variance</div>
      </div>
    </div>
  );
};

export default KpiTilesRow;