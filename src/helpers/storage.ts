import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import { LANGUAGE_STORAGE_KEY, PLAYER_NAME_STORAGE_KEY, THEME_STORAGE_KEY } from '@/data';
import { BEST_SCORE_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '@/games/constants';
import type { Language } from '@/i18n';
import type { GameSettings, ThemeId } from '@/types';

import { clearCompassCursors } from '@/games/helpers/compassCursors';

import { sanitizeSettings } from './settings';

const isLanguage = (value: unknown): value is Language => value === 'fr' || value === 'en';
const isThemeId = (value: unknown): value is ThemeId => value === 'night' || value === 'day';

/** Langue du systeme si anglais detecte, sinon francais (seules langues gerees). */
export const systemLanguage = (): Language => (getLocales()[0]?.languageCode === 'en' ? 'en' : 'fr');

export const loadSettings = async (): Promise<GameSettings> => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    return sanitizeSettings(raw === null ? null : JSON.parse(raw));
  } catch {
    return sanitizeSettings(null);
  }
};

export const saveSettings = async (settings: GameSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Reglages non sauves : sans gravite.
  }
};

export const loadLanguage = async (): Promise<Language> => {
  try {
    const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(raw) ? raw : systemLanguage();
  } catch {
    return systemLanguage();
  }
};

export const saveLanguage = async (language: Language): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Langue non sauvee : sans gravite, retour au francais.
  }
};

export const loadThemeId = async (): Promise<ThemeId> => {
  try {
    const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(raw) ? raw : 'night';
  } catch {
    return 'night';
  }
};

export const saveThemeId = async (themeId: ThemeId): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    // Theme non sauve : sans gravite, retour a Nuit.
  }
};

/** Dernier nom tape dans le setup d'un jeu ; `null` tant qu'aucun (seul lecteur/ecrivain : prefill de `useSetupRoom`). */
export const loadPlayerName = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(PLAYER_NAME_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const savePlayerName = async (name: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(PLAYER_NAME_STORAGE_KEY, name);
  } catch {
    // Non sauve : au pire les autres jeux ne le prefillent pas.
  }
};

/** Efface tout ce que l'app sauve sur l'appareil : reglages Compass, langue, theme, nom partage, curseurs de lieux,
 * ancien "meilleur score". */
export const clearAppData = async (): Promise<void> => {
  clearCompassCursors();
  try {
    await AsyncStorage.multiRemove([
      BEST_SCORE_STORAGE_KEY,
      SETTINGS_STORAGE_KEY,
      LANGUAGE_STORAGE_KEY,
      THEME_STORAGE_KEY,
      PLAYER_NAME_STORAGE_KEY,
    ]);
  } catch {
    // Au pire les anciennes donnees restent, sans gravite.
  }
};
