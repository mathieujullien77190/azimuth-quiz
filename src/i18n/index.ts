import { createContext, useContext } from 'react';

import { translations } from './translations';
import type { Language, Translations } from './types';

export type { Language, Translations };

export type LanguageContextValue = {
  language: Language;
  /** Faux tant que la langue sauvegardee n'est pas lue (le francais par defaut est alors renvoye). */
  ready: boolean;
  setLanguage: (language: Language) => void;
  /** Remet la langue en memoire au francais par defaut, sans rien re-ecrire dans le stockage
   * (utilise apres "Vider les donnees" : sinon l'app garde la langue en memoire jusqu'au prochain
   * lancement, meme si le stockage est deja vide). */
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
