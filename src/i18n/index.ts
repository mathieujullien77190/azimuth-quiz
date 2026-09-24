import { createContext, useContext } from 'react';

import { translations } from './translations';
import type { Language, Translations } from './types';

export type { Language, Translations };

export type LanguageContextValue = {
  language: Language;
  /** False until the saved language has been read (French is returned by default until then). */
  ready: boolean;
  setLanguage: (language: Language) => void;
  /** Resets the in-memory language to French by default, without rewriting storage
   * (used after "Clear data": otherwise the app keeps the language in memory until the next
   * launch, even though storage is already empty). */
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
