import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../../../ui-common/design-system/theme';
import { TransactionDashboard } from '../ui/components/dashboard/TransactionDashboard';

// Import reducers
import transactionReducer from '../ui/state/transactionSlice';
import anomalyReducer from '../ui/state/anomalySlice';

// Configure Redux store
const store = configureStore({
  reducer: {
    transactions: transactionReducer,
    anomalies: anomalyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values for demo
    }),
});

/**
 * Transaction Patterns Analysis Page
 * 
 * A Next.js page that renders the Transaction Patterns Analysis tool
 */
export default function TransactionPatternsPage() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <TransactionDashboard />
      </ThemeProvider>
    </Provider>
  );
} 