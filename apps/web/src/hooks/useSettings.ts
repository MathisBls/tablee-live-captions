import { createContext, useContext } from 'react';
import type { SettingsContextValue } from '@/interfaces/settings';

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (value === null) {
    throw new Error('useSettings must be used inside <SettingsProvider>');
  }
  return value;
}
