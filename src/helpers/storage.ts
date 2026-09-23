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

/** Langue du systeme si l'anglais est detecte, francais par defaut sinon (seules langues gerees). */
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
    // Reglages non memorises : sans gravite.
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
    // Non memorise : la soucoupe recommencera a bouger au prochain lancement, sans gravite.
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
    // Langue non memorisee : sans gravite, le francais par defaut sera reutilise.
  }
};

/** Efface tout ce que l'app sauvegarde sur l'appareil : reglages Boussole, langue et etat de la
 * soucoupe (+ un eventuel "meilleur score" laisse par une version anterieure). Rien d'autre n'est
 * persiste (Indices n'a pas de sauvegarde, le score de fin de partie n'est plus memorise). */
export const clearAppData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      BEST_SCORE_STORAGE_KEY,
      SETTINGS_STORAGE_KEY,
      LANGUAGE_STORAGE_KEY,
      UFO_CAUGHT_STORAGE_KEY,
    ]);
  } catch {
    // Rien a faire : au pire les anciennes donnees restent, sans gravite.
  }
};
