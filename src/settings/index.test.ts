import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { DEFAULT_CONTOUR_SETTINGS } from '@/games/contour/constants';
import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import { loadSettings, saveSettings } from '@/helpers';

import { hydrateSettings, useClueSettings, useContourSettings, useSettings } from '.';

jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'),
  loadSettings: jest.fn(),
  saveSettings: jest.fn(),
}));

const mockedLoadSettings = loadSettings as jest.Mock;
const mockedSaveSettings = saveSettings as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedLoadSettings.mockResolvedValue(DEFAULT_SETTINGS);
  useSettings.setState({ settings: DEFAULT_SETTINGS, ready: false });
  useClueSettings.setState({ settings: DEFAULT_CLUE_SETTINGS });
  useContourSettings.setState({ settings: DEFAULT_CONTOUR_SETTINGS });
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

// Clues/Silhouette settings: no persistence at all (see each store's own comment in
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

describe('useContourSettings (Zustand store)', () => {
  it('starts with the default settings', () => {
    expect(useContourSettings.getState().settings).toEqual(DEFAULT_CONTOUR_SETTINGS);
  });

  it('updateSettings merges a partial patch without touching storage', () => {
    useContourSettings.getState().updateSettings({ rounds: 10 });

    expect(useContourSettings.getState().settings.rounds).toBe(10);
    expect(useContourSettings.getState().settings.playerName).toEqual(DEFAULT_CONTOUR_SETTINGS.playerName);
    expect(mockedSaveSettings).not.toHaveBeenCalled();
  });
});
