import type { Language } from '@tablee/shared';
import { useEffect, useMemo, useState } from 'react';
import { I18nContext } from '@/hooks/useI18n';
import { browserLanguage, messagesByLanguage } from '@/i18n/messages';
import type { ProviderProps } from './providers.types';

export function I18nProvider({ children }: ProviderProps) {
  const [language, setLanguage] = useState<Language>(browserLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({ language, messages: messagesByLanguage[language], setLanguage }),
    [language],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}
