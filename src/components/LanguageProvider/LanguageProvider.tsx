import { useCallback, useEffect, useMemo, useState } from 'react';

import { loadLanguage, saveLanguage } from '@/helpers';
import { LanguageContext, type Language } from '@/i18n';

import type { LanguageProviderProps } from './types';

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLanguage().then((stored) => {
      if (cancelled) return;
      setLanguageState(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    saveLanguage(next);
  }, []);

  const value = useMemo(() => ({ language, ready, setLanguage }), [language, ready, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
