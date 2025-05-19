import React, { useState, useEffect } from 'react';
import { ForecastHorizon, ForecastMetric, DimensionFilter } from '../../types';

interface PlanningRecommendationEngineProps {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'implemented' | 'rejected';
  timeline: {
    start: string;
    end: string;
  };
  steps: string[];
  expectedOutcome: string;
}

const PlanningRecommendationEngine: React.FC<PlanningRecommendationEngineProps> = ({
  horizon,
  metric,
  filters,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'planning' | 'tracking'>('recommendations');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'implemented' | 'rejected'>('all');

  // Generate mock recommendations
  useEffect(() => {
    setLoading(true);
    
    // This would be an API call in real implementation
    const fetchRecommendations = () => {
      // Generate mock recommendation data
      const mockRecommendations: Recommendation[] = [
        {
          id: 'rec-001',
          title: 'Increase Q4 Inventory Levels',
          description: 'Based on seasonal forecast pattern analysis, increase inventory levels for Q4 by 20% to accommodate expected holiday demand spike',
          impact: 'Reduce stockout probability by 35%, potentially increasing revenue by 8-12%',
          confidence: 0.92,
          priority: 'high',
          status: 'pending',
          timeline: {
            start: '2023-09-01',
            end: '2023-10-15',
          },
          steps: [
            'Review current inventory capacity',
            'Coordinate with suppliers for increased orders',
            'Adjust warehouse staffing for Q4',
            'Update inventory management system thresholds',
            'Monitor stock levels weekly during implementation',
          ],
          expectedOutcome: 'Fully stocked inventory ready for seasonal demand peak, minimizing lost sales opportunities while maintaining optimal carrying costs',
        },
        {
          id: 'rec-002',
          title: 'Adjust Pricing for High-Growth Products',
          description: 'Implement price optimization strategy for products showing >15% growth trend, focusing on price elasticity to maximize revenue',
          impact: 'Potential 5-8% revenue increase with minimal volume impact',
          confidence: 0.85,
          priority: 'medium',
          status: 'pending',
          timeline: {
            start: '2023-08-15',
            end: '2023-09-30',
          },
          steps: [
            'Identify high-growth products from forecast',
            'Analyze price elasticity coefficients',
            'Model revenue impact at different price points',
            'Create implementation schedule',
            'Monitor sales response to price changes',
          ],
          expectedOutcome: 'Optimized pricing structure that capitalizes on growth momentum while maintaining competitive position',
        },
        {
          id: 'rec-003',
          title: 'Reallocate Marketing Budget Based on Seasonal Forecast',
          description: 'Shift marketing spend to align with forecasted seasonal demand patterns, increasing allocation during growth periods',
          impact: 'Improve marketing ROI by 12-18% by aligning spend with highest demand periods',
          confidence: 0.78,
          priority: 'medium',
          status: 'pending',
          timeline: {
            start: '2023-08-01',
            end: '2023-12-31',
          },
          steps: [
            'Map forecast demand patterns to marketing calendar',
            'Identify high-impact periods for increased spend',
            'Reallocate budget across channels',
            'Create targeted campaigns for peak periods',
            'Establish measurement framework for ROI tracking',
          ],
          expectedOutcome: 'Optimized marketing spend aligned with demand forecast, maximizing customer acquisition during high-potential periods',
        },
        {
          id: 'rec-004',
          title: 'Implement Demand-Based Staffing Plan',
          description: 'Develop variable staffing model based on forecasted demand fluctuations to optimize labor costs while maintaining service levels',
          impact: 'Reduce labor costs by 7-10% while improving order fulfillment rates',
          confidence: 0.82,
          priority: 'high',
          status: 'pending',
          timeline: {
            start: '2023-09-15',
            end: '2023-11-30',
          },
          steps: [
            'Analyze historical staffing vs. demand patterns',
            'Create staffing level formulas based on forecast',
            'Develop flexible scheduling templates',
            'Train managers on variable staffing model',
            'Implement weekly schedule adjustments based on updated forecasts',
          ],
          expectedOutcome: 'Flexible workforce that scales with demand patterns, reducing costs during low periods while ensuring capacity during peaks',
        },
        {
          id: 'rec-005',
          title: 'Develop Contingency Plans for Low-Confidence Forecast Scenarios',
          description: 'Create backup operational plans for scenarios where forecast confidence intervals are wider than 15%',
          impact: 'Mitigate potential losses from forecast uncertainty by 30-40%',
          confidence: 0.74,
          priority: 'low',
          status: 'pending',
          timeline: {
            start: '2023-10-01',
            end: '2023-11-15',
          },
          steps: [
            'Identify forecast periods with high uncertainty',
            'Model potential variance scenarios',
            'Develop rapid response protocols for each scenario',
            'Pre-stage resources for contingency activation',
            'Train team leads on scenario identification and response',
          ],
          expectedOutcome: 'Risk-mitigated operational approach that can rapidly adjust to significant forecast deviations',
        },
      ];
      
      setRecommendations(mockRecommendations);
      setSelectedRecommendation(mockRecommendations[0].id);
      setLoading(false);
    };
    
    // Simulate API delay
    setTimeout(fetchRecommendations, 500);
  }, [horizon, metric, filters]);

  // Filter recommendations based on current filters
  const filteredRecommendations = recommendations.filter(rec => {
    if (filterPriority !== 'all' && rec.priority !== filterPriority) {
      return false;
    }
    if (filterStatus !== 'all' && rec.status !== filterStatus) {
      return false;
    }
    return true;
  });

  // Get the currently selected recommendation
  const currentRecommendation = recommendations.find(rec => rec.id === selectedRecommendation);

  // Handle status change
  const handleStatusChange = (id: string, newStatus: 'pending' | 'implemented' | 'rejected') => {
    setRecommendations(prevRecs => 
      prevRecs.map(rec => 
        rec.id === id ? { ...rec, status: newStatus } : rec
      )
    );
  };

  // Render a recommendation card
  const RecommendationCard = ({ recommendation }: { recommendation: Recommendation }) => {
    const priorityColor = 
      recommendation.priority === 'high' ? 'border-signal-magenta' : 
      recommendation.priority === 'medium' ? 'border-electric-cyan' : 
      'border-blue-400';
    
    const isSelected = recommendation.id === selectedRecommendation;
    
    return (
      <div 
        className={`bg-midnight-navy rounded-xl p-4 border-l-4 ${priorityColor} cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-electric-cyan' : 'hover:bg-graphite'
        }`}
        onClick={() => setSelectedRecommendation(recommendation.id)}
      >
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-cloud-white">{recommendation.title}</h3>
          <div className={`
            px-2 py-0.5 text-xs rounded-full 
            ${recommendation.priority === 'high' ? 'bg-red-900 text-red-300' : 
              recommendation.priority === 'medium' ? 'bg-blue-900 text-blue-300' : 
              'bg-green-900 text-green-300'}
          `}>
            {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)} Priority
          </div>
        </div>
        
        <p className="text-sm text-cloud-white opacity-70 mt-2 line-clamp-2">
          {recommendation.description}
        </p>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            <span className="text-xs text-cloud-white opacity-80">Confidence:</span>
            <div className="ml-2 bg-midnight-navy rounded-full h-2 w-16">
              <div 
                className="bg-electric-cyan h-full rounded-full"
                style={{ width: `${recommendation.confidence * 100}%` }}
              ></div>
            </div>
            <span className="ml-1 text-xs text-electric-cyan">{(recommendation.confidence * 100).toFixed(0)}%</span>
          </div>
          
          <div className={`
            px-2 py-0.5 text-xs rounded-full 
            ${recommendation.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 
              recommendation.status === 'implemented' ? 'bg-green-900 text-green-300' : 
              'bg-red-900 text-red-300'}
          `}>
            {recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
          </div>
        </div>
      </div>
    );
  };

  // Render implementation timeline
  const ImplementationTimeline = ({ recommendation }: { recommendation: Recommendation }) => {
    // Format dates to readable format
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-cloud-white">Implementation Timeline</h3>
        
        <div className="mt-2 bg-midnight-navy rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <div>
              <span className="text-xs text-cloud-white opacity-70">Start</span>
              <p className="text-electric-cyan">{formatDate(recommendation.timeline.start)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-cloud-white opacity-70">End</span>
              <p className="text-electric-cyan">{formatDate(recommendation.timeline.end)}</p>
            </div>
          </div>
          
          <div className="relative mt-4">
            <div className="absolute top-3 left-0 right-0 h-1 bg-graphite rounded-full"></div>
            
            {/* Timeline steps */}
            <div className="relative flex justify-between">
              {recommendation.steps.map((_, index) => (
                <div 
                  key={index}
                  className="relative z-10 w-6 h-6 rounded-full bg-midnight-navy border-2 border-electric-cyan flex items-center justify-center"
                >
                  <span className="text-xs text-electric-cyan">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            {recommendation.steps.map((step, index) => (
              <div key={index} className="flex">
                <div className="w-6 h-6 rounded-full bg-midnight-navy border-2 border-electric-cyan flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-xs text-electric-cyan">{index + 1}</span>
                </div>
                <div>
                  <p className="text-sm text-cloud-white">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render expected outcome
  const ExpectedOutcome = ({ recommendation }: { recommendation: Recommendation }) => {
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-cloud-white">Expected Outcome</h3>
        
        <div className="mt-2 bg-midnight-navy rounded-lg p-4">
          <p className="text-sm text-cloud-white">{recommendation.expectedOutcome}</p>
          
          <div className="mt-4 p-3 bg-graphite rounded-lg">
            <h4 className="text-sm font-semibold text-cloud-white">Projected Impact</h4>
            <p className="text-sm text-electric-cyan mt-1">{recommendation.impact}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-cloud-white">Planning Recommendation Engine</h2>
        <div className="flex space-x-2">
          {/* Priority filter */}
          <select
            className="bg-midnight-navy text-cloud-white p-2 rounded-md"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          
          {/* Status filter */}
          <select
            className="bg-midnight-navy text-cloud-white p-2 rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="implemented">Implemented</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-graphite">
        {(['recommendations', 'planning', 'tracking'] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              selectedTab === tab 
                ? 'border-electric-cyan text-electric-cyan' 
                : 'border-transparent text-cloud-white hover:text-electric-cyan'
            }`}
            onClick={() => setSelectedTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations list - left column */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-cloud-white">
              {selectedTab === 'recommendations' ? 'Available Recommendations' : 
               selectedTab === 'planning' ? 'Implementation Planning' : 
               'Recommendation Tracking'}
            </h3>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-28 bg-midnight-navy rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((recommendation) => (
                  <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                ))
              ) : (
                <div className="text-center py-8 text-cloud-white opacity-70">
                  No recommendations match the current filters
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Recommendation detail - right column */}
        <div className="bg-graphite rounded-xl p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-midnight-navy rounded-lg w-3/4"></div>
              <div className="h-4 bg-midnight-navy rounded-lg w-full"></div>
              <div className="h-4 bg-midnight-navy rounded-lg w-5/6"></div>
              <div className="h-32 bg-midnight-navy rounded-lg w-full"></div>
            </div>
          ) : currentRecommendation ? (
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-cloud-white">{currentRecommendation.title}</h3>
                <div className={`
                  px-3 py-1 text-sm rounded-full 
                  ${currentRecommendation.priority === 'high' ? 'bg-red-900 text-red-300' : 
                    currentRecommendation.priority === 'medium' ? 'bg-blue-900 text-blue-300' : 
                    'bg-green-900 text-green-300'}
                `}>
                  {currentRecommendation.priority.charAt(0).toUpperCase() + currentRecommendation.priority.slice(1)} Priority
                </div>
              </div>
              
              <p className="text-cloud-white opacity-80 mt-3">
                {currentRecommendation.description}
              </p>
              
              <div className="mt-4 p-4 bg-midnight-navy rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-cloud-white opacity-70">Impact Estimate</span>
                    <p className="text-electric-cyan font-medium">{currentRecommendation.impact}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-cloud-white opacity-70">Confidence</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-graphite h-2 rounded-full mr-2">
                        <div 
                          className="bg-electric-cyan h-full rounded-full"
                          style={{ width: `${currentRecommendation.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-electric-cyan">{(currentRecommendation.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedTab === 'recommendations' && (
                <div className="mt-6 flex space-x-3">
                  <button 
                    className="flex-1 bg-electric-cyan text-midnight-navy font-medium py-2 rounded-lg hover:bg-electric-cyan/90 transition-colors"
                    onClick={() => setSelectedTab('planning')}
                  >
                    View Implementation Plan
                  </button>
                  <button 
                    className="flex-1 bg-midnight-navy text-cloud-white font-medium py-2 rounded-lg hover:bg-graphite transition-colors"
                    onClick={() => handleStatusChange(currentRecommendation.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              )}
              
              {selectedTab === 'planning' && (
                <>
                  <ImplementationTimeline recommendation={currentRecommendation} />
                  <ExpectedOutcome recommendation={currentRecommendation} />
                  
                  <div className="mt-6 flex space-x-3">
                    <button 
                      className="flex-1 bg-electric-cyan text-midnight-navy font-medium py-2 rounded-lg hover:bg-electric-cyan/90 transition-colors"
                      onClick={() => handleStatusChange(currentRecommendation.id, 'implemented')}
                    >
                      Mark as Implemented
                    </button>
                    <button 
                      className="flex-1 bg-midnight-navy text-cloud-white font-medium py-2 rounded-lg hover:bg-graphite transition-colors"
                    >
                      Send to Planning
                    </button>
                  </div>
                </>
              )}
              
              {selectedTab === 'tracking' && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-cloud-white">Implementation Status</h3>
                  
                  <div className="mt-2 bg-midnight-navy rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-cloud-white opacity-70">Current Status</span>
                        <div className={`
                          px-2 py-0.5 text-sm inline-block mt-1 rounded-full 
                          ${currentRecommendation.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 
                            currentRecommendation.status === 'implemented' ? 'bg-green-900 text-green-300' : 
                            'bg-red-900 text-red-300'}
                        `}>
                          {currentRecommendation.status.charAt(0).toUpperCase() + currentRecommendation.status.slice(1)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-cloud-white opacity-70">Completion</span>
                        <div className="w-32 bg-graphite h-2 rounded-full mt-1">
                          <div 
                            className="bg-electric-cyan h-full rounded-full"
                            style={{ width: currentRecommendation.status === 'implemented' ? '100%' : '30%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <span className="text-sm text-cloud-white opacity-70">Status Update</span>
                      <p className="text-sm text-cloud-white mt-1">
                        {currentRecommendation.status === 'implemented' 
                          ? 'Recommendation fully implemented on schedule. Monitoring impact against forecast.' 
                          : currentRecommendation.status === 'rejected'
                            ? 'Recommendation rejected due to resource constraints.'
                            : 'Implementation in progress. Currently completing step 2 of 5.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-cloud-white">Actual vs. Expected Impact</h3>
                    
                    <div className="mt-2 bg-midnight-navy rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-cloud-white opacity-70">Expected</span>
                          <p className="text-electric-cyan">{currentRecommendation.impact}</p>
                        </div>
                        <div>
                          <span className="text-sm text-cloud-white opacity-70">Actual</span>
                          <p className="text-signal-magenta">
                            {currentRecommendation.status === 'implemented' 
                              ? 'Improved by 7% (tracking in line with forecast)' 
                              : 'Not yet available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-cloud-white opacity-70">Select a recommendation to see details</p>
            </div>
          )}
        </div>
      </div>

      {/* Integration options */}
      <div className="bg-midnight-navy rounded-xl p-4">
        <h3 className="text-lg font-semibold text-cloud-white mb-3">Integration Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="bg-graphite text-cloud-white py-2 px-4 rounded-lg hover:bg-electric-cyan hover:text-midnight-navy transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Send to Inventory Planning
          </button>
          
          <button className="bg-graphite text-cloud-white py-2 px-4 rounded-lg hover:bg-electric-cyan hover:text-midnight-navy transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Add to Production Schedule
          </button>
          
          <button className="bg-graphite text-cloud-white py-2 px-4 rounded-lg hover:bg-electric-cyan hover:text-midnight-navy transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add to Calendar
          </button>
          
          <button className="bg-graphite text-cloud-white py-2 px-4 rounded-lg hover:bg-electric-cyan hover:text-midnight-navy transition-colors flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Share with Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanningRecommendationEngine;