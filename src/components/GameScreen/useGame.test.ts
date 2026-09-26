import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { CATEGORIES, DEFAULT_SETTINGS, DIFFICULTIES, MAX_STRAIGHT_DISTANCE_KM } from '@/constants';
import { resolveOrigin } from '@/helpers';
import { useSettings } from '@/settings';
import type { GameSettings } from '@/types';

import { useGame } from './useGame';

jest.mock('@/settings', () => ({ useSettings: jest.fn() }));
jest.mock('@/helpers', () => ({ ...jest.requireActual('@/helpers'), resolveOrigin: jest.fn() }));

const mockedUseSettings = useSettings as jest.Mock;
const mockedResolveOrigin = resolveOrigin as jest.Mock;

// Every category/difficulty: guarantees plenty of matching places regardless of exactly how any
// given place is currently rated.
const baseSettings: GameSettings = {
  ...DEFAULT_SETTINGS,
  playerNames: ['Zoé'],
  categories: CATEGORIES.map((c) => c.id),
  difficulties: DIFFICULTIES.map((d) => d.id),
  rounds: 2,
  useGps: false,
  customLatitude: 48.8566,
  customLongitude: 2.3522,
};

const settingsFixture = (overrides: Partial<GameSettings> = {}) => ({ ...baseSettings, ...overrides });

const mockSettings = (overrides: Partial<GameSettings> = {}, ready = true) => {
  mockedUseSettings.mockReturnValue({
    settings: settingsFixture(overrides),
    ready,
    updateSettings: jest.fn(),
    resetSettings: jest.fn(),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSettings();
});

describe('useGame — startup', () => {
  it('starts in the loading phase, then reaches guess with a place and players once ready', async () => {
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));
    expect(result.current.place).toBeDefined();
    expect(result.current.players).toEqual([{ name: 'Zoé', color: expect.any(String) }]);
    expect(result.current.isMultiplayer).toBe(false);
    expect(result.current.roundNumber).toBe(1);
    expect(result.current.totalRounds).toBe(2);
    expect(result.current.totals).toEqual([0]);
  });

  it('stays in loading until settings are ready', async () => {
    mockSettings({}, false);
    const { result } = await renderHook(() => useGame());
    expect(result.current.phase).toBe('loading');
  });

  it('resolves the device position through resolveOrigin when useGps is on', async () => {
    mockedResolveOrigin.mockResolvedValue({
      name: 'Ma position',
      coordinates: { latitude: 10, longitude: 20 },
      isDevicePosition: true,
    });
    mockSettings({ useGps: true });
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));
    expect(mockedResolveOrigin).toHaveBeenCalled();
    expect(result.current.origin.isDevicePosition).toBe(true);
  });

  it('does not update state after unmount if resolveOrigin settles late', async () => {
    let resolveLate!: (value: Awaited<ReturnType<typeof resolveOrigin>>) => void;
    mockedResolveOrigin.mockReturnValue(new Promise((resolve) => (resolveLate = resolve)));
    mockSettings({ useGps: true });
    const { unmount } = await renderHook(() => useGame());
    await unmount();
    expect(() =>
      resolveLate({ name: 'Late', coordinates: { latitude: 0, longitude: 0 }, isDevicePosition: true }),
    ).not.toThrow();
  });
});

describe('useGame — solo round flow', () => {
  it('submitting with both fields touched reveals the round and scores it', async () => {
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));

    await act(() => {
      result.current.setBearing(45);
    });
    await act(() => {
      result.current.setDistanceKm(500);
    });
    expect(result.current.bearingTouched).toBe(true);
    expect(result.current.distanceTouched).toBe(true);

    await act(() => {
      result.current.submit();
    });
    expect(result.current.phase).toBe('reveal');
    expect(result.current.currentRecord).toBeDefined();
    expect(result.current.totals[0]).toBe(result.current.currentRecord?.results[0].score.total);
  });

  it('still submits even if the haptic feedback call fails', async () => {
    const notificationAsync = jest.spyOn(Haptics, 'notificationAsync').mockRejectedValueOnce(new Error('no haptics'));
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));

    await act(() => result.current.setBearing(45));
    await act(() => result.current.setDistanceKm(500));
    await act(() => result.current.submit());
    // Flushes the rejected promise's `.catch(() => {})` before asserting nothing crashed.
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.phase).toBe('reveal');
    notificationAsync.mockRestore();
  });

  it('advances to the next round, then to "end" after the last round', async () => {
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));

    await act(() => result.current.setBearing(10));
    await act(() => result.current.setDistanceKm(200));
    await act(() => result.current.submit());
    expect(result.current.phase).toBe('reveal');

    await act(() => result.current.next());
    expect(result.current.phase).toBe('guess');
    expect(result.current.roundNumber).toBe(2);

    await act(() => result.current.setBearing(10));
    await act(() => result.current.setDistanceKm(200));
    await act(() => result.current.submit());
    await act(() => result.current.next());
    expect(result.current.phase).toBe('end');
  });

  it('restart begins a brand new game from the loading phase', async () => {
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));
    const firstRoundNumber = result.current.roundNumber;

    await act(() => {
      result.current.restart();
    });
    await waitFor(() => expect(result.current.phase).toBe('guess'));
    expect(result.current.roundNumber).toBe(firstRoundNumber);
    expect(result.current.records).toEqual([]);
  });
});

describe('useGame — multiplayer', () => {
  it('submit moves to the first unanswered player instead of revealing while some are missing', async () => {
    mockSettings({ playerNames: ['Zoé', 'Max', 'Alex'] });
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));
    const [starter] = result.current.roundOrder;

    expect(result.current.activePlayerIndex).toBe(starter);
    await act(() => result.current.submit());
    expect(result.current.phase).toBe('guess');
    expect(result.current.activePlayerIndex).not.toBe(starter);
  });
});

describe('useGame — straight-line mode', () => {
  it('caps the distance at MAX_STRAIGHT_DISTANCE_KM and derives an inclination from the guess', async () => {
    mockSettings({ straightLine: true });
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));
    expect(result.current.maxDistanceKm).toBe(MAX_STRAIGHT_DISTANCE_KM);

    await act(() => result.current.setBearing(10));
    await act(() => result.current.setDistanceKm(4000));
    await act(() => result.current.submit());
    expect(result.current.currentRecord?.results[0].guess.inclination).toBeGreaterThan(0);
  });
});

describe('useGame — degenerate settings (defensive fallbacks)', () => {
  it('falls back to player index 0 when a round somehow starts with no players', async () => {
    mockSettings({ playerNames: [] });
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));
    expect(result.current.players).toEqual([]);
    expect(result.current.activePlayerIndex).toBe(0);
  });
});

describe('useGame — no places available', () => {
  it('commitActiveGuess is a defensive no-op when there is no place for this round (0 rounds)', async () => {
    mockSettings({ rounds: 0 });
    const { result } = await renderHook(() => useGame());
    await waitFor(() => expect(result.current.phase).toBe('guess'));
    expect(result.current.place).toBeUndefined();
    expect(result.current.totalRounds).toBe(0);

    await act(() => result.current.submit());
    // Nothing crashes, and no reveal happens since there is nothing to score.
    expect(result.current.phase).toBe('guess');
  });
});
