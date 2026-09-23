import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import {
  BEST_SCORE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  UFO_CAUGHT_STORAGE_KEY,
} from '@/constants';

import {
  clearAppData,
  loadLanguage,
  loadSettings,
  loadUfoCaught,
  saveLanguage,
  saveSettings,
  saveUfoCaught,
  systemLanguage,
} from './storage';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));

const mockedGetLocales = getLocales as jest.Mock;

beforeEach(async () => {
  await AsyncStorage.clear();
  mockedGetLocales.mockReturnValue([{ languageCode: 'fr' }]);
});

describe('systemLanguage', () => {
  it('returns "en" when the device locale is English', () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'en' }]);
    expect(systemLanguage()).toBe('en');
  });

  it('defaults to "fr" for any other locale', () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'de' }]);
    expect(systemLanguage()).toBe('fr');
  });

  it('defaults to "fr" when there is no locale at all', () => {
    mockedGetLocales.mockReturnValue([]);
    expect(systemLanguage()).toBe('fr');
  });
});

describe('loadSettings / saveSettings', () => {
  it('returns sanitized defaults when nothing is stored', async () => {
    const settings = await loadSettings();
    expect(settings.rounds).toBe(5);
  });

  it('round-trips settings saved earlier', async () => {
    const stored = await loadSettings();
    await saveSettings({ ...stored, rounds: 15 });
    const reloaded = await loadSettings();
    expect(reloaded.rounds).toBe(15);
  });

  it('falls back to sanitized defaults on corrupted JSON', async () => {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, '{not json');
    const settings = await loadSettings();
    expect(settings.rounds).toBe(5);
  });

  it('loadSettings tolerates a storage read failure', async () => {
    // AsyncStorage.getItem est deja un jest.fn() (mock manuel, voir async-storage-mock) : on
    // configure directement un rejet pour LE PROCHAIN appel, sans jest.spyOn — spyOn+mockRestore
    // sur un mock deja existant ne restaure pas la vraie implementation (mockRestore la vide).
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const settings = await loadSettings();
    expect(settings.rounds).toBe(5);
  });

  it('saveSettings tolerates a storage write failure', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(saveSettings(await loadSettings())).resolves.toBeUndefined();
  });
});

describe('loadUfoCaught / saveUfoCaught', () => {
  it('is false until saved', async () => {
    expect(await loadUfoCaught()).toBe(false);
    await saveUfoCaught();
    expect(await loadUfoCaught()).toBe(true);
  });

  it('tolerates read/write failures', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(await loadUfoCaught()).toBe(false);

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(saveUfoCaught()).resolves.toBeUndefined();
  });
});

describe('loadLanguage / saveLanguage', () => {
  it('falls back to the system language when nothing is stored', async () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'en' }]);
    expect(await loadLanguage()).toBe('en');
  });

  it('round-trips a saved language', async () => {
    await saveLanguage('en');
    expect(await loadLanguage()).toBe('en');
  });

  it('ignores a stored value that is not a known language', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'de');
    expect(await loadLanguage()).toBe('fr');
  });

  it('tolerates read/write failures', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(await loadLanguage()).toBe('fr');

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(saveLanguage('en')).resolves.toBeUndefined();
  });
});

describe('clearAppData', () => {
  it('removes every known storage key', async () => {
    await AsyncStorage.setItem(BEST_SCORE_STORAGE_KEY, '1');
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, '{}');
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    await AsyncStorage.setItem(UFO_CAUGHT_STORAGE_KEY, 'true');

    await clearAppData();

    expect(await AsyncStorage.getItem(BEST_SCORE_STORAGE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(UFO_CAUGHT_STORAGE_KEY)).toBeNull();
  });

  it('tolerates a failure clearing storage', async () => {
    (AsyncStorage.multiRemove as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(clearAppData()).resolves.toBeUndefined();
  });
});
