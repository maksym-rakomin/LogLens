// Redux store configuration
import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';

// Create and configure Redux store
export const store = configureStore({
  reducer: {
    // Include RTK Query reducer for API cache management
    [api.reducerPath]: api.reducer,
  },
  // Add RTK Query middleware for caching and invalidation
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// TypeScript types - application state and dispatch function
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
