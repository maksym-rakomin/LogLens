// API Slice для RTK Query - описує всі ендпоінти бекенду
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { LogsResponse, LogFilters, StatsResponse, ExplainResponse } from '@/lib/types';

// Створюємо API клієнт з базовим URL із змінних оточення
export const api = createApi({
  // Унікальне ім'я для редьюсера
  reducerPath: 'api',

  // Базове налаштування для HTTP-запитів
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:4000'
  }),

  // Теги для автоматичної інвалідації кешу при оновленнях
  tagTypes: ['Logs', 'Stats'],

  // Визначення ендпоінтів (API методів)
  endpoints: (builder) => ({
    // Отримання статистики логів
    getStats: builder.query<StatsResponse, void>({
      query: () => '/api/stats',
      providesTags: ['Stats'],
    }),

    // Отримання списку логів з фільтрацією та пагінацією
    getLogs: builder.query<LogsResponse, Partial<LogFilters>>({
      query: (filters) => ({
        url: '/api/logs',
        params: filters, // Параметри автоматично перетворюються в query рядок
      }),
      providesTags: ['Logs'],
    }),

    // Отримання плану виконання запиту (EXPLAIN аналіз)
    getExplain: builder.query<ExplainResponse, Partial<LogFilters>>({
      query: (filters) => ({
        url: '/api/logs/explain',
        params: filters,
      }),
    }),
  }),
});

// Експортуємо автосгенеровані хуки для використання в компонентах
export const {
  useGetStatsQuery,
  useGetLogsQuery,
  useGetExplainQuery,
} = api;
