// Конфігурація Redux сховища
import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';

// Створюємо і налаштовуємо Redux store
export const store = configureStore({
  reducer: {
    // Підключаємо редьюсер від RTK Query для керування кешем API
    [api.reducerPath]: api.reducer,
  },
  // Додаємо middleware від RTK Query для обробки кешування та інвалідації
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// Типи для TypeScript - стан всього застосунку і функція dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
