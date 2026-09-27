import { DIFFICULTIES } from '@/data';
import { CATEGORIES, DEFAULT_SETTINGS } from '@/games/compass/constants';
import { pickPlaces, resolveOrigin } from '@/helpers';
import type { GameSettings, Place } from '@/types';

import { DEFAULT_DRAFT, useGameStore } from './gameStore';

jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'),
  resolveOrigin: jest.fn(),
  pickPlaces: jest.fn(),
}));

const mockedResolveOrigin = resolveOrigin as jest.Mock;
const mockedPickPlaces = pickPlaces as jest.Mock;

const settings: GameSettings = {
  ...DEFAULT_SETTINGS,
  playerNames: ['Zoé'],
  categories: CATEGORIES.map((c) => c.id),
  difficulties: DIFFICULTIES.map((d) => d.id),
  rounds: 2,
  useGps: false,
  customLatitude: 48.8566,
  customLongitude: 2.3522,
};

const places: Place[] = [
  {
    name: 'Tokyo',
    code: 'JP',
    coordinates: { latitude: 35.68, longitude: 139.69 },
    category: 'cities',
    difficulty: 'easy',
  },
  {
    name: 'Lima',
    code: 'PE',
    coordinates: { latitude: -12.05, longitude: -77.04 },
    category: 'cities',
    difficulty: 'easy',
  },
];

const initialState = useGameStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  useGameStore.setState(initialState, true);
  mockedPickPlaces.mockReturnValue(places);
});

describe('gameStore — start', () => {
  it('resolves the custom origin (no GPS) and picks places, landing in the guess phase', async () => {
    await useGameStore.getState().start(settings, 'fr', 'Ma position');
    const state = useGameStore.getState();

    expect(mockedResolveOrigin).not.toHaveBeenCalled();
    expect(state.phase).toBe('guess');
    expect(state.config).toBe(settings);
    expect(state.places).toBe(places);
    expect(state.roundIndex).toBe(0);
    expect(state.records).toEqual([]);
    expect(state.draftsByPlayer).toEqual([DEFAULT_DRAFT]);
    expect(state.activePlayerIndex).toBe(0);
  });

  it('resolves the device position through resolveOrigin when useGps is on', async () => {
    mockedResolveOrigin.mockResolvedValue({
      name: 'Ma position',
      coordinates: { latitude: 10, longitude: 20 },
      isDevicePosition: true,
    });
    await useGameStore.getState().start({ ...settings, useGps: true }, 'fr', 'Ma position');
    expect(mockedResolveOrigin).toHaveBeenCalledWith('Ma position');
    expect(useGameStore.getState().origin.isDevicePosition).toBe(true);
  });

  it('a call invalidated by cancelStart before resolveOrigin settles never applies its result', async () => {
    let resolveLate!: (value: Awaited<ReturnType<typeof resolveOrigin>>) => void;
    mockedResolveOrigin.mockReturnValue(new Promise((resolve) => (resolveLate = resolve)));

    const pending = useGameStore.getState().start({ ...settings, useGps: true }, 'fr', 'Ma position');
    useGameStore.getState().cancelStart();
    resolveLate({ name: 'Late', coordinates: { latitude: 0, longitude: 0 }, isDevicePosition: true });
    await pending;

    // Still 'loading': the stale resolution was ignored, nothing else ever moved it to 'guess'.
    expect(useGameStore.getState().phase).toBe('loading');
  });
});

describe('gameStore — submit / next', () => {
  const startSolo = () => useGameStore.getState().start(settings, 'fr', 'Ma position');

  it('reveals and scores the round once the only player has answered', async () => {
    await startSolo();
    useGameStore.getState().setBearing(45);
    useGameStore.getState().setDistanceKm(500);
    useGameStore.getState().submit();

    const state = useGameStore.getState();
    expect(state.phase).toBe('reveal');
    expect(state.records).toHaveLength(1);
    expect(state.records[0].results[0].guess).toEqual({ bearing: 45, distanceKm: 500, inclination: 0 });
  });

  it('moves to the next unanswered player instead of revealing, in multiplayer', async () => {
    await useGameStore.getState().start({ ...settings, playerNames: ['Zoé', 'Max'] }, 'fr', 'Ma position');
    const starter = useGameStore.getState().activePlayerIndex;

    useGameStore.getState().submit();

    expect(useGameStore.getState().phase).toBe('guess');
    expect(useGameStore.getState().activePlayerIndex).not.toBe(starter);
  });

  it('is a defensive no-op when there is no place for this round', async () => {
    mockedPickPlaces.mockReturnValue([]);
    await startSolo();
    useGameStore.getState().submit();
    expect(useGameStore.getState().phase).toBe('guess');
  });

  it('next advances to the next round, then to "end" after the last one', async () => {
    await startSolo();
    useGameStore.getState().submit();
    useGameStore.getState().next();
    expect(useGameStore.getState().phase).toBe('guess');
    expect(useGameStore.getState().roundIndex).toBe(1);

    useGameStore.getState().submit();
    useGameStore.getState().next();
    expect(useGameStore.getState().phase).toBe('end');
  });
});
