import dynamic from 'next/dynamic';
import React from 'react';
import { ThemeProvider } from '../../ui-common/design-system/theme';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AnyAction } from '@reduxjs/toolkit';
import demandForecastReducer, { 
  fetchSeasonalPatterns, 
  fetchModelPerformance 
} from '../../Sales/tools/DemandForecastEngine/ui/state/demandForecastSlice';

// Set up a Redux store properly configured with our reducer
const store = configureStore({
  reducer: {
    demandForecast: demandForecastReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values for demo
    }),
});

// Dispatch initial data loading actions
store.dispatch(fetchSeasonalPatterns() as unknown as AnyAction);
store.dispatch(fetchModelPerformance() as unknown as AnyAction);

// Import the test component with SSR disabled to avoid hydration issues
const TestComponents = dynamic(
  () => import('../../Sales/tools/DemandForecastEngine/ui/components/dashboard/TestComponents'),
  { ssr: false }
);

/**
 * Test page for DemandForecastEngine components
 */
const TestPage: React.FC = () => {
  console.log("Rendering TestPage");
  
  return (
    <Provider store={store}>
      <ThemeProvider>
        <TestComponents />
      </ThemeProvider>
    </Provider>
  );
};

export default TestPage; 