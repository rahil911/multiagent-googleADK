import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dynamic from 'next/dynamic';
import { ThemeProvider, enterpriseIQTheme } from '../../ui-common/design-system/theme';

// Import reducer
import demandForecastReducer from '../../Sales/tools/DemandForecastEngine/ui/state/demandForecastSlice';

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
      <ThemeProvider theme={enterpriseIQTheme}>
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: (enterpriseIQTheme && enterpriseIQTheme.colors) ? enterpriseIQTheme.colors.midnight : defaultBgColor,
          color: (enterpriseIQTheme && enterpriseIQTheme.colors) ? enterpriseIQTheme.colors.cloudWhite : defaultTextColor,
        }}>
          <DemandForecastDashboard />
        </div>
      </ThemeProvider>
    </Provider>
  );
} 