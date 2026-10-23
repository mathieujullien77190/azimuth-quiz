import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import {
  DIFFICULTIES,
  LANGUAGE_STORAGE_KEY,
  LAST_JOINED_ROOM_STORAGE_KEY,
  PLAYER_NAME_STORAGE_KEY,
  ROUND_OPTIONS,
  THEME_STORAGE_KEY,
} from '@/data';
import { BEST_SCORE_STORAGE_KEY, CATEGORIES, DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/games/constants';
import { clearCursors } from '@/games/helpers/cursors';
import type { Language } from '@/i18n';
import type { Category, Difficulty, GameSettings, ThemeId } from '@/types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Reconstruit des reglages valides depuis des donnees stockees (possiblement perimees ou corrompues). */
export const sanitizeSettings = (raw: unknown): GameSettings => {
  if (!isRecord(raw)) return DEFAULT_SETTINGS;

  // Anciens reglages multi-joueurs : `playerNames`, dont le premier est ce joueur.
  const legacyName = Array.isArray(raw.playerNames) ? raw.playerNames[0] : undefined;
  const savedName = typeof raw.playerName === 'string' ? raw.playerName : legacyName;
  const playerName = typeof savedName === 'string' ? savedName : DEFAULT_SETTINGS.playerName;

  const validCategories = CATEGORIES.map((category) => category.id);
  const categories = Array.isArray(raw.categories)
    ? raw.categories.filter((category): category is Category => validCategories.includes(category as Category))
    : [];

  // Anciens reglages : liste `difficulties`, on garde la premiere valide.
  const validDifficulties = DIFFICULTIES.map((entry) => entry.id);
  const isDifficulty = (value: unknown): value is Difficulty => validDifficulties.includes(value as Difficulty);
  const difficulty = isDifficulty(raw.difficulty)
    ? raw.difficulty
    : ((Array.isArray(raw.difficulties) ? raw.difficulties.find(isDifficulty) : undefined) ??
      DEFAULT_SETTINGS.difficulty);

  const rounds = ROUND_OPTIONS.some((option) => option === raw.rounds)
    ? (raw.rounds as number)
    : DEFAULT_SETTINGS.rounds;
  const flag = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);
  const coordinate = (value: unknown, min: number, max: number, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback;

  return {
    playerName,
    categories: categories.length > 0 ? categories : DEFAULT_SETTINGS.categories,
    difficulty,
    rounds,
    useGps: flag(raw.useGps, DEFAULT_SETTINGS.useGps),
    customLatitude: coordinate(raw.customLatitude, -90, 90, DEFAULT_SETTINGS.customLatitude),
    customLongitude: coordinate(raw.customLongitude, -180, 180, DEFAULT_SETTINGS.customLongitude),
    liveCompass: flag(raw.liveCompass, DEFAULT_SETTINGS.liveCompass),
    showCountry: flag(raw.showCountry, DEFAULT_SETTINGS.showCountry),
    travel: flag(raw.travel, DEFAULT_SETTINGS.travel),
  };
};

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

/** Efface tout ce que l'app sauve sur l'appareil : reglages du jeu, langue, theme, nom partage, curseurs de lieux,
 * ancien "meilleur score". */
export const clearAppData = async (): Promise<void> => {
  clearCursors();
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

// Hors de `firebase/roomCode.ts` et du barrel : seul AsyncStorage est requis, sans les imports Firebase de ce fichier.

/** Code de la derniere room rejointe (« partie precedente » d'un joiner), s'il est garde. */
export const loadLastJoinedRoom = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_JOINED_ROOM_STORAGE_KEY);
  } catch {
    return null;
  }
};

/** Retient la room rejointe pour proposer de la rejoindre ; un echec est sans gravite. */
export const saveLastJoinedRoom = async (code: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_JOINED_ROOM_STORAGE_KEY, code);
  } catch {
    // Non retenu : pas de raccourci « rejoindre la partie precedente ».
  }
};
