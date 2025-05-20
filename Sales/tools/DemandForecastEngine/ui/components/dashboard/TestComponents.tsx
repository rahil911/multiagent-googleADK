import React from 'react';
import { ThemeProvider } from '../../../../../../ui-common/design-system/theme';
import SeasonalPatternDetector from './seasonalPatternDetector';
import ModelPerformanceAnalyzer from './ModelPerformanceAnalyzer';

/**
 * Test harness component to debug rendering issues
 * This component can be accessed directly at /demand-forecast/test
 */
const TestComponents: React.FC = () => {
  // Mock model type change handler
  const handleModelTypeChange = (modelType: string) => {
    console.log('Model type changed to:', modelType);
  };

  console.log('Rendering TestComponents harness');

  return (
    <ThemeProvider>
      <div style={{ 
        backgroundColor: '#0a1224', 
        padding: '20px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1 style={{ color: '#f7f9fb', margin: '0 0 20px 0' }}>
          Component Test Page
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#00e0ff' }}>Seasonal Pattern Detector</h2>
          <div style={{ height: '500px' }}>
            <SeasonalPatternDetector 
              horizon="month"
              metric="quantity" 
              filters={{}}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#00e0ff' }}>Model Performance Analyzer</h2>
          <div style={{ height: '600px' }}>
            <ModelPerformanceAnalyzer 
              modelType="movingAverage"
              onModelTypeChange={handleModelTypeChange}
              horizon="month"
              metric="quantity"
              filters={{}}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default TestComponents; 