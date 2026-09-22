import AsyncStorage from '@react-native-async-storage/async-storage';

import { BEST_SCORE_STORAGE_KEY, LANGUAGE_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '@/constants';
import type { Language } from '@/i18n';
import type { GameSettings } from '@/types';

import { sanitizeSettings } from './settings';

const isLanguage = (value: unknown): value is Language => value === 'fr' || value === 'en';

export const loadBestScore = async (): Promise<number> => {
  try {
    const raw = await AsyncStorage.getItem(BEST_SCORE_STORAGE_KEY);
    const value = raw === null ? 0 : Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
};

export const saveBestScore = async (score: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(BEST_SCORE_STORAGE_KEY, String(score));
  } catch {
    // Score non persiste : sans gravite pour le jeu.
  }
};

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
    // Reglages non memorises : sans gravite.
  }
};

export const loadLanguage = async (): Promise<Language> => {
  try {
    const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(raw) ? raw : 'fr';
  } catch {
    return 'fr';
  }
};

export const saveLanguage = async (language: Language): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Langue non memorisee : sans gravite, le francais par defaut sera reutilise.
  }
};
