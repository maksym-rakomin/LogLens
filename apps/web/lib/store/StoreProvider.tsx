// Client wrapper component for Redux Provider
// Required because Next.js App Router uses server components by default
'use client';

import { Provider } from 'react-redux';
import { store } from './store';

// Provider wraps the application and makes Redux store available to all components
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
