import { DEFAULT_SETTINGS } from '@/games/constants';
import { loadPlayerName, loadSettings, savePlayerName, saveSettings } from '@/helpers';

import {
  hydratePlayerName,
  hydrateSettings,
  usePlayerName,
  useSettings,
} from '..';

jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'),
  loadPlayerName: jest.fn(),
  loadSettings: jest.fn(),
  savePlayerName: jest.fn(),
  saveSettings: jest.fn(),
}));

const mockedLoadPlayerName = loadPlayerName as jest.Mock;
const mockedLoadSettings = loadSettings as jest.Mock;
const mockedSavePlayerName = savePlayerName as jest.Mock;
const mockedSaveSettings = saveSettings as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedLoadPlayerName.mockResolvedValue(null);
  mockedLoadSettings.mockResolvedValue(DEFAULT_SETTINGS);
  useSettings.setState({ settings: DEFAULT_SETTINGS, ready: false });
  usePlayerName.setState({ playerName: '', ready: false });
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
    // Le reste des reglages est conserve (fusion partielle).
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
