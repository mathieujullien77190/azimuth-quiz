import AsyncStorage from '@react-native-async-storage/async-storage';

import { BEST_SCORE_STORAGE_KEY, DEFAULT_THEME_MODE, SETTINGS_STORAGE_KEY, THEME_MODES, THEME_MODE_STORAGE_KEY } from '@/constants';
import type { GameSettings, ThemeMode } from '@/types';

import { sanitizeSettings } from './settings';

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

export const loadThemeMode = async (): Promise<ThemeMode> => {
  try {
    const raw = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
    return THEME_MODES.find((mode) => mode.id === raw)?.id ?? DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
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

export const saveThemeMode = async (mode: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // Apparence non memorisee : sans gravite.
  }
};
