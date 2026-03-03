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
    // Налаштовано для підтримки нескінченного скролу (Infinite Scroll)
    getLogs: builder.query<LogsResponse, Partial<LogFilters>>({
      query: (filters) => ({
        url: '/api/logs',
        params: filters, // Параметри автоматично перетворюються в query рядок
      }),
      
      // 1. Групуємо кеш для правильної роботи нескінченного скролу
      // Ми кажемо RTK Query: "Ігноруй зміну cursor або page при створенні ключа кешу".
      // Якщо змінюється пошук (search) або рівень (level) - це новий кеш (список очиститься).
      // Якщо змінюється тільки cursor - використовуємо існуючий кеш для склеювання даних.
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { cursor, page, ...baseFilters } = queryArgs;
        return `${endpointName}-${JSON.stringify(baseFilters)}`;
      },
      
      // 2. Логіка склеювання (Merge) старих і нових даних
      // currentCache - те, що вже є на екрані, newItems - те, що щойно прийшло з бекенду
      merge: (currentCache, newItems, { arg }) => {
        // Якщо це режим cursor І ми передали конкретний cursor (тобто це завантаження наступної сторінки)
        if (arg.mode === 'cursor' && arg.cursor) {
          // Додаємо нові логи в кінець існуючого масиву
          currentCache.data.push(...newItems.data);
          // Оновлюємо метадані (щоб отримати новий nextCursor)
          currentCache.meta = newItems.meta;
        } else {
          // Якщо це перше завантаження, зміна фільтрів або режим offset - повністю замінюємо дані
          return newItems;
        }
      },
      
      // 3. Примусовий запит при зміні аргументів
      // Оскільки ми сказали ігнорувати cursor у ключі кешу (пункт 1),
      // нам треба змусити RTK Query робити запит, коли cursor все ж таки змінюється
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      
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
