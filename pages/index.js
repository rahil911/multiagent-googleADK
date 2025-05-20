import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../ui-common/design-system/theme';
import { QueryInput } from '../ui-common/QueryInput/QueryInput';
import { RobotCharacter } from '../ui-common/ai-interaction/RobotCharacter/RobotCharacter';

// Import reducers
import purchaseFrequencyReducer from '../Customer/tools/purchase_frequency/ui/state/purchaseFrequencySlice';

// Configure Redux store
const store = configureStore({
  reducer: {
    purchaseFrequency: purchaseFrequencyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values for demo
    }),
});

// Define available tools with dynamic imports
const componentRegistry = {
  'purchase-frequency': {
    histogram: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/FrequencyHistogram')),
    heatmap: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/IntervalHeatmap')),
    quadrant: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/SegmentQuadrant')),
    regularity: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/RegularityChart')),
    treemap: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/ValueTreemap')),
  },
  'demand-forecast': {
    linechart: dynamic(() => import('../Sales/tools/DemandForecastEngine/ui/components/dashboard/ForecastHorizonExplorer')),
    performance: dynamic(() => import('../Sales/tools/DemandForecastEngine/ui/components/dashboard/ModelPerformanceAnalyzer')),
    seasonal: dynamic(() => import('../Sales/tools/DemandForecastEngine/ui/components/dashboard/SeasonalPatternDetector')),
    scenario: dynamic(() => import('../Sales/tools/DemandForecastEngine/ui/components/dashboard/ForecastScenarioBuilder')),
  }
  // Additional tools can be added here when components are available
};

/**
 * Enterprise IQ - Conversational Canvas
 * 
 * AI-powered interface for interacting with data analytics components
 */
export default function ConversationalCanvas() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [robotState, setRobotState] = useState({
    position: { x: 50, y: 50 },
    state: 'idle',
    message: null,
    laserTarget: null,
    isVisible: true
  });

  // State for drag and resize
  const [activeComponent, setActiveComponent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  // State for z-index management
  const [zIndexCounter, setZIndexCounter] = useState(1);
  const [componentZIndices, setComponentZIndices] = useState({});

  // Function to bring a component to the foreground
  const bringToForeground = (componentId) => {
    setZIndexCounter(prev => prev + 1);
    setComponentZIndices(prev => ({
      ...prev,
      [componentId]: zIndexCounter
    }));
    setActiveComponent(componentId);
  };

  // Function to handle fetch errors
  const handleFetchError = (error) => {
    console.error('Error fetching data:', error);
    setRobotState({
      ...robotState,
      state: 'error',
      message: 'There was an error fetching data from the database. Please try again.',
    });
    setLoading(false);
  };

  // Function to spawn a component on the canvas
  const spawnComponent = async (componentType, props = {}, position = null) => {
    setLoading(true);
    const id = `component-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create default position if none provided
    const componentPosition = position || {
      x: Math.floor(Math.random() * (canvasRef.current.offsetWidth - 400)),
      y: Math.floor(Math.random() * (canvasRef.current.offsetHeight - 300)),
    };
    
    const [toolName, componentName] = componentType.split('.');
    
    if (!componentRegistry[toolName] || !componentRegistry[toolName][componentName]) {
      console.error(`Component not found: ${componentType}`);
      setLoading(false);
      return null;
    }
    
    try {
      // Fetch real data for the component based on its tool type
      let data = {};
      let componentData = {};
      let apiEndpoint = '';
      
      if (toolName === 'purchase-frequency') {
        apiEndpoint = '/api/purchase-frequency/data';
        const response = await fetch(apiEndpoint);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        data = await response.json();
        
        // Map the component to its data
        switch (componentName) {
          case 'histogram':
            componentData = data.frequencyHistogram;
            break;
          case 'treemap':
            componentData = { data: data.valueTreemap };
            break;
          case 'heatmap':
            componentData = data.intervalHeatmap;
            break;
          case 'quadrant':
            componentData = { data: data.segmentQuadrant };
            break;
          case 'regularity':
            componentData = { data: data.regularityChart };
            break;
          default:
            componentData = {};
        }
      } 
      else if (toolName === 'demand-forecast') {
        // For demand forecast components, we need to call different endpoints
        // based on the component type
        let endpoint = '';
        switch (componentName) {
          case 'linechart':
            endpoint = 'forecast';
            break;
          case 'performance':
            endpoint = 'performance';
            break;
          case 'seasonal':
            endpoint = 'seasonal';
            break;
          case 'scenario':
            endpoint = 'forecast';  // For scenario, we use the base forecast data first
            break;
          default:
            endpoint = 'forecast';
        }
        
        apiEndpoint = `/api/sales/demand-forecast/data?endpoint=${endpoint}`;
        const response = await fetch(apiEndpoint);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        data = await response.json();
        
        // Set up component-specific props based on the dashboard design
        switch (componentName) {
          case 'linechart':
            componentData = {
              data: data,
              horizon: 'month',
              metric: 'quantity',
              confidenceLevel: 95,
              filters: {},
              onHorizonChange: () => {},
              onMetricChange: () => {},
              onConfidenceLevelChange: () => {},
              onFilterChange: () => {},
              onClearFilters: () => {}
            };
            break;
          case 'performance':
            componentData = {
              data: data,
              modelType: 'movingAverage',
              horizon: 'month',
              metric: 'quantity',
              filters: {},
              onModelTypeChange: () => {}
            };
            break;
          case 'seasonal':
            componentData = {
              data: data,
              horizon: 'month',
              metric: 'quantity',
              filters: {}
            };
            break;
          case 'scenario':
            componentData = {
              data: data,
              horizon: 'month',
              metric: 'quantity',
              confidenceLevel: 95,
              filters: {}
            };
            break;
          default:
            componentData = {};
        }
      }
      
      // Merge the fetched data with any provided props
      const mergedProps = { ...componentData, ...props };
      
      setComponents(prev => [
        ...prev,
        {
          id,
          type: componentType,
          position: componentPosition,
          size: { width: 500, height: 400 }, // Larger default size for forecast visualizations
          props: mergedProps,
          Component: componentRegistry[toolName][componentName]
        }
      ]);
      
      // Assign the highest z-index to the new component
      bringToForeground(id);
      
      setLoading(false);
      return id;
    } catch (error) {
      handleFetchError(error);
      return null;
    }
  };
  
  // Function to update an existing component
  const updateComponent = (componentId, newProps) => {
    setComponents(prev => 
      prev.map(component => 
        component.id === componentId 
          ? { ...component, props: { ...component.props, ...newProps } }
          : component
      )
    );
  };
  
  // Function to remove a component
  const removeComponent = (componentId) => {
    setComponents(prev => prev.filter(component => component.id !== componentId));
    // Remove component from z-index tracking
    setComponentZIndices(prev => {
      const updatedZIndices = {...prev};
      delete updatedZIndices[componentId];
      return updatedZIndices;
    });
  };
  
  // Function to start dragging a component
  const handleDragStart = (e, component) => {
    bringToForeground(component.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - component.position.x,
      y: e.clientY - component.position.y,
    });
    e.preventDefault();
  };
  
  // Function to start resizing a component
  const handleResizeStart = (e, component) => {
    bringToForeground(component.id);
    setIsResizing(true);
    setInitialSize({
      width: component.size.width,
      height: component.size.height,
    });
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
    });
    e.preventDefault();
  };
  
  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && activeComponent) {
        // Update component position while dragging
        setComponents(prev => 
          prev.map(comp => 
            comp.id === activeComponent
              ? { 
                  ...comp, 
                  position: { 
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                  } 
                }
              : comp
          )
        );
      } else if (isResizing && activeComponent) {
        // Update component size while resizing
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        setComponents(prev => 
          prev.map(comp => 
            comp.id === activeComponent
              ? { 
                  ...comp, 
                  size: { 
                    width: Math.max(300, initialSize.width + deltaX),
                    height: Math.max(200, initialSize.height + deltaY)
                  } 
                }
              : comp
          )
        );
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, activeComponent, dragOffset, initialSize, resizeStart]);
  
  // Function to highlight a component
  const highlightComponent = (componentId, reason) => {
    // Find the component
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    // Update robot to point at the component
    setRobotState({
      ...robotState,
      state: 'pointing',
      laserTarget: {
        x: component.position.x + component.size.width / 2,
        y: component.position.y + component.size.height / 2,
      },
      message: reason,
    });
  };
  
  // Function to handle user queries
  const handleQuerySubmit = async (query) => {
    // Show robot thinking
    setRobotState({
      ...robotState,
      state: 'thinking',
      message: `Processing: "${query}"`,
    });
    
    setLoading(true);
    
    try {
      // In a production environment, this would call an LLM to process the query
      // For now, we'll use keyword matching for demonstration
      
      setTimeout(async () => {
        if (query.toLowerCase().includes('purchase') && query.toLowerCase().includes('frequency')) {
          const histogramId = await spawnComponent('purchase-frequency.histogram');
          
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'Here\'s a histogram showing customer purchase frequency distribution based on real transaction data.',
          });
        } else if (query.toLowerCase().includes('customer segment')) {
          const quadrantId = await spawnComponent('purchase-frequency.quadrant');
          
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'I\'ve added a customer segment quadrant visualization that plots customers by frequency and value.',
          });
        } else if (query.toLowerCase().includes('interval') || query.toLowerCase().includes('heatmap')) {
          const heatmapId = await spawnComponent('purchase-frequency.heatmap');
          
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'Here\'s a heatmap showing purchase intervals by day and hour.',
          });
        } else if (query.toLowerCase().includes('value') || query.toLowerCase().includes('segment')) {
          const treemapId = await spawnComponent('purchase-frequency.treemap');
          
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'I\'ve created a treemap showing customer value segments.',
          });
        } else if (query.toLowerCase().includes('regularity')) {
          const regularityId = await spawnComponent('purchase-frequency.regularity');
          
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'Here\'s a radar chart showing purchase regularity across different timeframes.',
          });
        } else if (query.toLowerCase().includes('demand forecast') && query.toLowerCase().includes('line chart')) {
          const linechartId = await spawnComponent('demand-forecast.linechart');
          
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'Here\'s a line chart showing demand forecast data with confidence intervals.',
          });
        } else if (query.toLowerCase().includes('demand forecast') && query.toLowerCase().includes('performance')) {
          const performanceId = await spawnComponent('demand-forecast.performance');
          
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'Here\'s a visualization showing the performance metrics of different forecasting models.',
          });
        } else if (query.toLowerCase().includes('demand forecast') && query.toLowerCase().includes('seasonal')) {
          const seasonalId = await spawnComponent('demand-forecast.seasonal');
          
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'Here\'s a visualization showing seasonal patterns detected in the demand data.',
          });
        } else if (query.toLowerCase().includes('demand forecast') && query.toLowerCase().includes('scenario')) {
          const scenarioId = await spawnComponent('demand-forecast.scenario');
          
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'Here\'s the scenario builder for demand forecasting where you can customize different growth assumptions.',
          });
        } else {
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: 'I understand you\'re asking about: ' + query + '. You can ask about purchase frequency, customer segments, value segments, regularity, interval patterns, or demand forecasts.',
          });
          
          setLoading(false);
        }
      }, 1000);
    } catch (error) {
      handleFetchError(error);
    }
  };
  
  return (
    <Provider store={store}>
      <ThemeProvider>
        <div 
          style={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            backgroundColor: '#0F172A',
            overflow: 'hidden'
          }}
        >
          {/* Canvas Header */}
          <header style={{
            width: '100%',
            padding: '12px 20px',
            backgroundColor: '#1E293B',
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Enterprise IQ</h1>
          </header>
          
          {/* Main Canvas */}
          <div 
            ref={canvasRef}
            style={{
              position: 'relative',
              width: '100%',
              height: 'calc(100vh - 130px)', // Account for header and query input
              padding: '20px',
              overflow: 'hidden'
            }}
          >
            {/* Loading indicator */}
            {loading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '15px 25px',
                borderRadius: '8px',
                color: '#E2E8F0',
                zIndex: 1000
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    borderTop: '3px solid #00e0ff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ margin: 0 }}>Loading data...</p>
                </div>
              </div>
            )}
            
            {/* Render components */}
            {components.map((component) => (
              <div 
                key={component.id}
                style={{
                  position: 'absolute',
                  left: `${component.position.x}px`,
                  top: `${component.position.y}px`,
                  width: `${component.size.width}px`,
                  height: `${component.size.height}px`,
                  backgroundColor: '#1E293B',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: isDragging && activeComponent === component.id ? 'grabbing' : 'grab',
                  zIndex: componentZIndices[component.id] || 1,
                  border: activeComponent === component.id ? '2px solid #3b82f6' : '1px solid #2d3748'
                }}
                onMouseDown={(e) => {
                  bringToForeground(component.id);
                  handleDragStart(e, component);
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 15px',
                  borderBottom: '1px solid #2D3748',
                  backgroundColor: '#161E2E',
                }}>
                  <div style={{ color: '#E2E8F0', fontWeight: 500 }}>
                    {component.type.split('.')[1]}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeComponent(component.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '0 5px'
                    }}
                  >
                    ×
                  </button>
                </div>
                <div 
                  style={{ 
                    padding: '15px', 
                    flex: 1,
                    overflow: 'auto',
                    height: 'calc(100% - 40px)'
                  }}
                  onClick={() => bringToForeground(component.id)}
                >
                  <component.Component 
                    {...component.props} 
                    width={component.size.width - 30} // Account for padding
                    height={component.size.height - 80} // Account for header and padding
                  />
                </div>
                {/* Resize handle */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '20px',
                    height: '20px',
                    cursor: 'nwse-resize',
                    background: 'transparent'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleResizeStart(e, component);
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', right: 5, bottom: 5 }}>
                    <path d="M10 2L2 10M6 2L2 6M10 6L6 10" stroke="#94A3B8" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            ))}
            
            {/* Robot Character */}
            <RobotCharacter
              initialPosition={robotState.position}
              state={robotState.state}
              message={robotState.message}
              laserTarget={robotState.laserTarget}
              isVisible={robotState.isVisible}
            />
          </div>
          
          {/* Query Input */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            padding: '10px 20px',
            backgroundColor: '#1E293B',
          }}>
            <QueryInput 
              onSubmit={handleQuerySubmit}
              placeholder="Ask about purchase frequency, customer segments, or demand forecasts..."
              disabled={loading}
            />
          </div>
          
          {/* CSS Animation for Loading */}
          <style jsx global>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </ThemeProvider>
    </Provider>
  );
} 