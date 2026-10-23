import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import { LANGUAGE_STORAGE_KEY, PLAYER_NAME_STORAGE_KEY, THEME_STORAGE_KEY } from '@/data';
import { BEST_SCORE_STORAGE_KEY, DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/data/game';

import {
  clearAppData,
  loadLanguage,
  loadLastJoinedRoom,
  loadPlayerName,
  loadSettings,
  loadThemeId,
  sanitizeSettings,
  saveLanguage,
  saveLastJoinedRoom,
  savePlayerName,
  saveSettings,
  saveThemeId,
  systemLanguage,
} from '../storage';

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
    // AsyncStorage.getItem est deja un jest.fn() (mock manuel) : on programme un rejet pour LE PROCHAIN appel,
    // sans jest.spyOn (spyOn+mockRestore sur un mock existant vide l'implementation au lieu de la restaurer).
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const settings = await loadSettings();
    expect(settings.rounds).toBe(5);
  });

  it('saveSettings tolerates a storage write failure', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(saveSettings(await loadSettings())).resolves.toBeUndefined();
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

describe('loadThemeId / saveThemeId', () => {
  it('falls back to "night" when nothing is stored', async () => {
    expect(await loadThemeId()).toBe('night');
  });

  it('round-trips a saved theme', async () => {
    await saveThemeId('day');
    expect(await loadThemeId()).toBe('day');
  });

  it('ignores a stored value that is not a known theme', async () => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, 'sunset');
    expect(await loadThemeId()).toBe('night');
  });

  it('tolerates read/write failures', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(await loadThemeId()).toBe('night');

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(saveThemeId('day')).resolves.toBeUndefined();
  });
});

describe('loadPlayerName / savePlayerName', () => {
  it('is null until saved', async () => {
    expect(await loadPlayerName()).toBeNull();
    await savePlayerName('Zoé');
    expect(await loadPlayerName()).toBe('Zoé');
  });

  it('tolerates read/write failures', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(await loadPlayerName()).toBeNull();

    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(savePlayerName('Zoé')).resolves.toBeUndefined();
  });
});

describe('clearAppData', () => {
  it('removes every known storage key', async () => {
    await AsyncStorage.setItem(BEST_SCORE_STORAGE_KEY, '1');
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, '{}');
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    await AsyncStorage.setItem(THEME_STORAGE_KEY, 'day');
    await AsyncStorage.setItem(PLAYER_NAME_STORAGE_KEY, 'Zoé');

    await clearAppData();

    expect(await AsyncStorage.getItem(BEST_SCORE_STORAGE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(PLAYER_NAME_STORAGE_KEY)).toBeNull();
  });

  it('tolerates a failure clearing storage', async () => {
    (AsyncStorage.multiRemove as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(clearAppData()).resolves.toBeUndefined();
  });
});

describe('sanitizeSettings', () => {
  it('returns DEFAULT_SETTINGS when raw is not an object', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it('returns DEFAULT_SETTINGS entirely when raw is an empty object', () => {
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps a saved player name', () => {
    expect(sanitizeSettings({ playerName: 'Alice' }).playerName).toBe('Alice');
    expect(sanitizeSettings({ playerName: '' }).playerName).toBe('');
  });

  it('takes the first name of the list saved when several players shared a device', () => {
    expect(sanitizeSettings({ playerNames: ['Alice', 'Bob'] }).playerName).toBe('Alice');
  });

  it('prefers the new setting to an old list', () => {
    expect(sanitizeSettings({ playerName: 'Cara', playerNames: ['Alice'] }).playerName).toBe('Cara');
  });

  it('falls back to DEFAULT_SETTINGS.playerName when the name is not a string', () => {
    expect(sanitizeSettings({ playerName: 42 }).playerName).toBe(DEFAULT_SETTINGS.playerName);
    expect(sanitizeSettings({ playerNames: [42, false] }).playerName).toBe(DEFAULT_SETTINGS.playerName);
    expect(sanitizeSettings({ playerNames: [] }).playerName).toBe(DEFAULT_SETTINGS.playerName);
  });

  it('keeps only valid category ids, ignoring unknown ones', () => {
    const result = sanitizeSettings({ categories: ['cities', 'not-a-category', 'mountains'] });
    expect(result.categories).toEqual(['cities', 'mountains']);
  });

  it('falls back to DEFAULT_SETTINGS.categories when none are valid', () => {
    const result = sanitizeSettings({ categories: ['bogus'] });
    expect(result.categories).toEqual(DEFAULT_SETTINGS.categories);
  });

  it('keeps a valid difficulty', () => {
    expect(sanitizeSettings({ difficulty: 'hard' }).difficulty).toBe('hard');
  });

  it('keeps the first valid entry of the old saved `difficulties` list', () => {
    const result = sanitizeSettings({ difficulties: ['bogus', 'hard', 'easy'] });
    expect(result.difficulty).toBe('hard');
  });

  it('falls back to DEFAULT_SETTINGS.difficulty when none is valid', () => {
    expect(sanitizeSettings({ difficulty: 'bogus' }).difficulty).toBe(DEFAULT_SETTINGS.difficulty);
    expect(sanitizeSettings({ difficulties: ['bogus'] }).difficulty).toBe(DEFAULT_SETTINGS.difficulty);
  });

  it('keeps a valid rounds option, falls back otherwise', () => {
    expect(sanitizeSettings({ rounds: 15 }).rounds).toBe(15);
    expect(sanitizeSettings({ rounds: 7 }).rounds).toBe(DEFAULT_SETTINGS.rounds);
  });

  it('keeps boolean flags when present, falls back to defaults for non-booleans', () => {
    const result = sanitizeSettings({ useGps: false, showCountry: 'yes' });
    expect(result.useGps).toBe(false);
    expect(result.showCountry).toBe(DEFAULT_SETTINGS.showCountry);
  });

  it('reads the travel mode as a flag, off by default (settings saved before it existed)', () => {
    expect(sanitizeSettings({ travel: true }).travel).toBe(true);
    expect(sanitizeSettings({ travel: 'yes' }).travel).toBe(false);
    expect(sanitizeSettings({}).travel).toBe(false);
  });

  it('keeps custom coordinates within range, falls back otherwise', () => {
    const result = sanitizeSettings({ customLatitude: 10, customLongitude: 20 });
    expect(result.customLatitude).toBe(10);
    expect(result.customLongitude).toBe(20);
  });

  it('falls back to defaults for out-of-range or non-finite coordinates', () => {
    expect(sanitizeSettings({ customLatitude: 200 }).customLatitude).toBe(DEFAULT_SETTINGS.customLatitude);
    expect(sanitizeSettings({ customLongitude: -200 }).customLongitude).toBe(DEFAULT_SETTINGS.customLongitude);
    expect(sanitizeSettings({ customLatitude: Infinity }).customLatitude).toBe(DEFAULT_SETTINGS.customLatitude);
    expect(sanitizeSettings({ customLatitude: 'north' }).customLatitude).toBe(DEFAULT_SETTINGS.customLatitude);
  });
});

beforeEach(() => AsyncStorage.clear());

describe('last joined room', () => {
  it('gives back the saved code, or null when there is none', async () => {
    await expect(loadLastJoinedRoom()).resolves.toBeNull();
    await saveLastJoinedRoom('tabofuna');
    await expect(loadLastJoinedRoom()).resolves.toBe('tabofuna');
  });

  it('swallows storage failures', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('boom'));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('boom'));
    await expect(loadLastJoinedRoom()).resolves.toBeNull();
    await expect(saveLastJoinedRoom('tabofuna')).resolves.toBeUndefined();
  });
});
