import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SettingsContext } from '@/hooks/useSettings';
import type { DisplaySettings } from '@/interfaces/settings';
import { loadDisplaySettings, saveDisplaySettings } from '@/services/storage/preferences';
import type { ProviderProps } from './providers.types';

/** Réglages d'affichage, appliqués en attributs sur <html> : tout le style suit sans re-rendu. */
export function SettingsProvider({ children }: ProviderProps) {
  const [settings, setSettings] = useState<DisplaySettings>(loadDisplaySettings);
  const systemReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const reducedMotion = settings.reduceMotion || systemReducedMotion;

  useEffect(() => {
    saveDisplaySettings(settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset['theme'] = settings.theme;
    root.dataset['contrast'] = settings.highContrast ? 'high' : 'normal';
    root.dataset['motion'] = reducedMotion ? 'reduced' : 'full';
    root.dataset['textSize'] = String(settings.textSize);
  }, [settings, reducedMotion]);

  const update = useCallback((patch: Partial<DisplaySettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const value = useMemo(
    () => ({ settings, reducedMotion, update }),
    [settings, reducedMotion, update],
  );

  return <SettingsContext value={value}>{children}</SettingsContext>;
}
