// API Slice for RTK Query - describes all backend endpoints
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { LogsResponse, LogFilters, StatsResponse, ExplainResponse } from '@/lib/types';

// Create API client with base URL from environment variables
export const api = createApi({
  // Unique name for the reducer
  reducerPath: 'api',

  // Base configuration for HTTP requests
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:4000'
  }),

  // Tags for automatic cache invalidation on updates
  tagTypes: ['Logs', 'Stats'],

  // Define endpoints (API methods)
  endpoints: (builder) => ({
    // Get log statistics
    getStats: builder.query<StatsResponse, void>({
      query: () => '/api/stats',
      providesTags: ['Stats'],
    }),

    // Get list of logs with filtering and pagination
    // Configured to support infinite scroll
    getLogs: builder.query<LogsResponse, Partial<LogFilters>>({
      query: (filters) => ({
        url: '/api/logs',
        params: filters, // Parameters automatically converted to query string
      }),

      // 1. Group cache for proper infinite scroll functionality
      // We tell RTK Query: "Ignore cursor or page changes when creating cache key".
      // If search or level changes - this is a new cache (list will be cleared).
      // If only cursor changes - use existing cache for data concatenation.
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { cursor, page, ...baseFilters } = queryArgs;
        return `${endpointName}-${JSON.stringify(baseFilters)}`;
      },

      // 2. Logic for merging old and new data
      // currentCache - what's already on screen, newItems - what just came from backend
      merge: (currentCache, newItems, { arg }) => {
        // If this is cursor mode AND we passed a specific cursor (i.e., loading next page)
        if (arg.mode === 'cursor' && arg.cursor) {
          // Append new logs to the end of existing array
          currentCache.data.push(...newItems.data);
          // Update metadata (to get new nextCursor)
          currentCache.meta = newItems.meta;
        } else {
          // If this is first load, filter change, or offset mode - completely replace data
          return newItems;
        }
      },

      // 3. Force request on argument changes
      // Since we said to ignore cursor in cache key (point 1),
      // we need to force RTK Query to make a request when cursor does change
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },

      providesTags: ['Logs'],
    }),

    // Get query execution plan (EXPLAIN analysis)
    getExplain: builder.query<ExplainResponse, Partial<LogFilters>>({
      query: (filters) => ({
        url: '/api/logs/explain',
        params: filters,
      }),
    }),
  }),
});

// Export auto-generated hooks for use in components
export const {
  useGetStatsQuery,
  useGetLogsQuery,
  useGetExplainQuery,
} = api;
