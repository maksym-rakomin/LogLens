// Клієнтський компонент-обгортка для Redux Provider
// Необхідний тому що Next.js App Router використовує серверні компоненти за замовчуванням
'use client';

import { Provider } from 'react-redux';
import { store } from './store';

// Провайдер обгортає застосунок і робить Redux store доступним для всіх компонентів
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
