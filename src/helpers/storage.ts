import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import {
  BEST_SCORE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  UFO_CAUGHT_STORAGE_KEY,
} from '@/constants';
import type { Language } from '@/i18n';
import type { GameSettings } from '@/types';

import { sanitizeSettings } from './settings';

const isLanguage = (value: unknown): value is Language => value === 'fr' || value === 'en';

/** System language if English is detected, French by default otherwise (only languages supported). */
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
    // Settings not saved: not critical.
  }
};

export const loadUfoCaught = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(UFO_CAUGHT_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
};

export const saveUfoCaught = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(UFO_CAUGHT_STORAGE_KEY, 'true');
  } catch {
    // Not saved: the UFO will start moving again on next launch, not critical.
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
    // Language not saved: not critical, French will be used as the default again.
  }
};

/** Clears everything the app saves on the device: Boussole settings, language and UFO
 * state (+ a possible "best score" left over from an earlier version). Nothing else is
 * persisted (Indices has no save, the end-of-game score is no longer stored). */
export const clearAppData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      BEST_SCORE_STORAGE_KEY,
      SETTINGS_STORAGE_KEY,
      LANGUAGE_STORAGE_KEY,
      UFO_CAUGHT_STORAGE_KEY,
    ]);
  } catch {
    // Nothing to do: at worst the old data sticks around, not critical.
  }
};
