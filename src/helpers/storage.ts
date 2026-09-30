import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import {
  ANIMATIONS_ENABLED_STORAGE_KEY,
  MASCOT_CAUGHT_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  PLAYER_NAME_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '@/data';
import { BEST_SCORE_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '@/games/compass/constants';
import type { Language } from '@/i18n';
import type { GameSettings, ThemeId } from '@/types';

import { clearClueCursors } from '@/games/clues/helpers/clueCursors';
import { clearCompassCursors } from '@/games/compass/helpers/compassCursors';
import { clearContourCursors } from '@/games/contour/helpers/contourCursors';

import { sanitizeSettings } from './settings';

const isLanguage = (value: unknown): value is Language => value === 'fr' || value === 'en';
const isThemeId = (value: unknown): value is ThemeId => value === 'night' || value === 'day';

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

export const loadMascotCaught = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(MASCOT_CAUGHT_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
};

export const saveMascotCaught = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(MASCOT_CAUGHT_STORAGE_KEY, 'true');
  } catch {
    // Not saved: the mascot will start moving again on next launch, not critical.
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
    // Theme not saved: not critical, Night will be used as the default again.
  }
};

/** Last name typed in any game's setup — `null` until one has been (see `useSetupRoom`'s prefill,
 * the only reader/writer of this key). */
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
    // Not saved: at worst the other games don't get it prefilled, not critical.
  }
};

/** Off by default: some devices stutter on the mascot roaming/backdrop drift animations. */
export const loadAnimationsEnabled = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(ANIMATIONS_ENABLED_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
};

export const saveAnimationsEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(ANIMATIONS_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Not saved: not critical, defaults back to off on next launch.
  }
};

/** Clears everything the app saves on the device: Compass settings, language, theme, whether
 * the home screen's mascot has been caught, whether animations are enabled, the shared player
 * name, Clues' and Compass' place cursors (+ a possible "best score" left over from an earlier version).
 * Clues'/Contour's own settings aren't persisted in the first place (reset every launch). */
export const clearAppData = async (): Promise<void> => {
  clearClueCursors();
  clearCompassCursors();
  clearContourCursors();
  try {
    await AsyncStorage.multiRemove([
      BEST_SCORE_STORAGE_KEY,
      SETTINGS_STORAGE_KEY,
      LANGUAGE_STORAGE_KEY,
      THEME_STORAGE_KEY,
      MASCOT_CAUGHT_STORAGE_KEY,
      ANIMATIONS_ENABLED_STORAGE_KEY,
      PLAYER_NAME_STORAGE_KEY,
    ]);
  } catch {
    // Nothing to do: at worst the old data sticks around, not critical.
  }
};
