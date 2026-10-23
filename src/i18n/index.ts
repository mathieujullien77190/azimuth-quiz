import { createContext, useContext } from 'react';

import { translations } from './translations';
import type { Language, Translations } from './types';

export type { Language, Translations };

export type LanguageContextValue = {
  language: Language;
  /** Faux tant que la langue sauvegardee n'est pas lue (francais par defaut). */
  ready: boolean;
  setLanguage: (language: Language) => void;
  /** Remet le francais en memoire sans toucher au stockage (apres "Effacer les donnees"). */
  resetLanguage: () => void;
};

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'fr',
  ready: true,
  setLanguage: () => {},
  resetLanguage: () => {},
});

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);

export const useTranslation = (): Translations => translations[useLanguage().language];
