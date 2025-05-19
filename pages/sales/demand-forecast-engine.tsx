import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dynamic from 'next/dynamic';
import { ThemeProvider } from '../../ui-common/design-system/theme';

// Import reducer (you need to create this)
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

export default function DemandForecastPage() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <div className="min-h-screen bg-midnight-navy">
          <DemandForecastDashboard />
        </div>
      </ThemeProvider>
    </Provider>
  );
} 