import React from 'react';
import { Provider } from 'react-redux';
import { configureStore, AnyAction } from '@reduxjs/toolkit';
import dynamic from 'next/dynamic';
import { ThemeProvider } from '../../ui-common/design-system/theme';

// Import reducer
import demandForecastReducer, { 
  fetchSeasonalPatterns, 
  fetchModelPerformance 
} from '../../Sales/tools/DemandForecastEngine/ui/state/demandForecastSlice';

// Configure Redux store
const store = configureStore({
  reducer: {
    demandForecast: demandForecastReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values for demo
    }),
});

// Dispatch initial data loading actions
store.dispatch(fetchSeasonalPatterns() as unknown as AnyAction);
store.dispatch(fetchModelPerformance() as unknown as AnyAction);

// Dynamic import of dashboard component
const DemandForecastDashboard = dynamic(
  () => import('../../Sales/tools/DemandForecastEngine/ui/components/dashboard/DemandForecastDashboard'),
  { ssr: false }
);

// Define a fallback background color in case theme is undefined
const defaultBgColor = '#0a1224'; // Midnight Navy color
const defaultTextColor = '#f7f9fb'; // Cloud White color

export default function DemandForecastPage() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: defaultBgColor,
          color: defaultTextColor,
        }}>
          <DemandForecastDashboard />
        </div>
      </ThemeProvider>
    </Provider>
  );
} 