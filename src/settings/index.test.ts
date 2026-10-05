import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import { loadDevCode, loadPlayerName, loadSettings, saveDevCode, savePlayerName, saveSettings } from '@/helpers';

import { act, renderHook } from '@testing-library/react-native';

import { DEV_CODE } from '@/data';

import {
  hydrateDevCode,
  hydratePlayerName,
  hydrateSettings,
  useClueSettings,
  useDevCode,
  useDevMode,
  usePlayerName,
  useSettings,
} from '.';

jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'),
  loadDevCode: jest.fn(),
  loadPlayerName: jest.fn(),
  loadSettings: jest.fn(),
  saveDevCode: jest.fn(),
  savePlayerName: jest.fn(),
  saveSettings: jest.fn(),
}));

const mockedLoadDevCode = loadDevCode as jest.Mock;
const mockedSaveDevCode = saveDevCode as jest.Mock;
const mockedLoadPlayerName = loadPlayerName as jest.Mock;
const mockedLoadSettings = loadSettings as jest.Mock;
const mockedSavePlayerName = savePlayerName as jest.Mock;
const mockedSaveSettings = saveSettings as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedLoadPlayerName.mockResolvedValue(null);
  mockedLoadDevCode.mockResolvedValue(null);
  mockedLoadSettings.mockResolvedValue(DEFAULT_SETTINGS);
  useSettings.setState({ settings: DEFAULT_SETTINGS, ready: false });
  useClueSettings.setState({ settings: DEFAULT_CLUE_SETTINGS });
  usePlayerName.setState({ playerName: '', ready: false });
  useDevCode.setState({ devCode: '', ready: false });
});

describe('useSettings (Zustand store)', () => {
  it('starts not ready with default settings, becomes ready once storage is read', async () => {
    expect(useSettings.getState().ready).toBe(false);
    expect(useSettings.getState().settings.rounds).toBe(DEFAULT_SETTINGS.rounds);

    hydrateSettings();
    await Promise.resolve();
    await Promise.resolve();

    expect(useSettings.getState().ready).toBe(true);
  });

  it('exposes the settings loaded from storage once hydrated', async () => {
    mockedLoadSettings.mockResolvedValue({ ...DEFAULT_SETTINGS, rounds: 15 });

    hydrateSettings();
    await Promise.resolve();
    await Promise.resolve();

    expect(useSettings.getState().settings.rounds).toBe(15);
  });

  it('updateSettings merges a partial patch and persists it', () => {
    useSettings.setState({ settings: DEFAULT_SETTINGS, ready: true });
    useSettings.getState().updateSettings({ useGps: false });

    expect(useSettings.getState().settings.useGps).toBe(false);
    // The rest of the settings is preserved (a partial merge, not a replacement).
    expect(useSettings.getState().settings.rounds).toBe(DEFAULT_SETTINGS.rounds);
    expect(mockedSaveSettings).toHaveBeenCalledWith(expect.objectContaining({ useGps: false }));
  });

  it('resetSettings restores the defaults in memory, without touching storage', () => {
    useSettings.setState({ settings: { ...DEFAULT_SETTINGS, rounds: 15 }, ready: true });
    useSettings.getState().resetSettings();

    expect(useSettings.getState().settings.rounds).toBe(DEFAULT_SETTINGS.rounds);
    expect(mockedSaveSettings).not.toHaveBeenCalled();
  });
});

// Clues settings: no persistence at all (see each store's own comment in
// `settings/index.ts`) — just the default-state and merge behavior, no `loadSettings`/
// `saveSettings` involved.
describe('useClueSettings (Zustand store)', () => {
  it('starts with the default settings', () => {
    expect(useClueSettings.getState().settings).toEqual(DEFAULT_CLUE_SETTINGS);
  });

  it('updateSettings merges a partial patch without touching storage', () => {
    useClueSettings.getState().updateSettings({ difficulty: 'hard' });

    expect(useClueSettings.getState().settings.difficulty).toBe('hard');
    // The rest of the settings is preserved (a partial merge, not a replacement).
    expect(useClueSettings.getState().settings.rounds).toBe(DEFAULT_CLUE_SETTINGS.rounds);
    expect(mockedSaveSettings).not.toHaveBeenCalled();
  });
});

describe('usePlayerName (Zustand store)', () => {
  it('starts not ready with an empty name, becomes ready once storage is read', async () => {
    expect(usePlayerName.getState().ready).toBe(false);
    expect(usePlayerName.getState().playerName).toBe('');

    hydratePlayerName();
    await Promise.resolve();
    await Promise.resolve();

    expect(usePlayerName.getState().ready).toBe(true);
  });

  it('exposes the name loaded from storage once hydrated', async () => {
    mockedLoadPlayerName.mockResolvedValue('Zoé');

    hydratePlayerName();
    await Promise.resolve();
    await Promise.resolve();

    expect(usePlayerName.getState().playerName).toBe('Zoé');
  });

  it('falls back to an empty name when nothing was ever saved', async () => {
    mockedLoadPlayerName.mockResolvedValue(null);

    hydratePlayerName();
    await Promise.resolve();
    await Promise.resolve();

    expect(usePlayerName.getState().playerName).toBe('');
  });

  it('setPlayerName updates and persists it', () => {
    usePlayerName.getState().setPlayerName('Max');

    expect(usePlayerName.getState().playerName).toBe('Max');
    expect(mockedSavePlayerName).toHaveBeenCalledWith('Max');
  });
});

describe('useDevCode (Zustand store)', () => {
  it('starts empty and not ready, then exposes the saved code once hydrated', async () => {
    expect(useDevCode.getState()).toMatchObject({ devCode: '', ready: false });
    mockedLoadDevCode.mockResolvedValue('abc');

    hydrateDevCode();
    await Promise.resolve();
    await Promise.resolve();

    expect(useDevCode.getState()).toMatchObject({ devCode: 'abc', ready: true });
  });

  it('falls back to an empty code when nothing was saved', async () => {
    hydrateDevCode();
    await Promise.resolve();
    await Promise.resolve();

    expect(useDevCode.getState()).toMatchObject({ devCode: '', ready: true });
  });

  it('setDevCode updates and persists it', () => {
    useDevCode.getState().setDevCode('abc');

    expect(useDevCode.getState().devCode).toBe('abc');
    expect(mockedSaveDevCode).toHaveBeenCalledWith('abc');
  });

  it('turns the dev mode on only for exactly the secret code (spaces around it ignored)', async () => {
    const { result } = await renderHook(() => useDevMode());
    expect(result.current).toBe(false);

    await act(async () => useDevCode.getState().setDevCode('supermatou2'));
    expect(result.current).toBe(false);

    await act(async () => useDevCode.getState().setDevCode(`  ${DEV_CODE} `));
    expect(result.current).toBe(true);
  });
});
