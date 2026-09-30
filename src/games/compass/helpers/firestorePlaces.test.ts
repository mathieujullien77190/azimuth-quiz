import { getDoc, getDocs } from 'firebase/firestore';

import type { CompassCounts, PlaceDoc } from '@/data/firestore/types';
import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import type { Category, Difficulty, GameSettings } from '@/types';

import { fetchRandomPlaces } from './firestorePlaces';
import { clearCompassHistory } from './placeHistory';

type Filter = { field: string; op: string; value: unknown };

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'places'),
  doc: jest.fn(() => 'countsRef'),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((...parts: unknown[]) => parts),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));
jest.mock('@/helpers/firebase', () => ({ db: {} }));

type Fake = { name: string; code: string; latitude: number; longitude: number };

/** A fake `places` collection: `groups['cities|easy'][n - 1]` is the place numbered `n` in that group. */
const installDb = (groups: Record<string, Fake[]>, countsOverride?: CompassCounts | null) => {
  const counts: CompassCounts = {};
  for (const [id, places] of Object.entries(groups)) {
    const [category, difficulty] = id.split('|') as [Category, Difficulty];
    counts[category] = { ...counts[category], [difficulty]: places.length };
  }
  jest.mocked(getDoc).mockResolvedValue({ data: () => (countsOverride === null ? undefined : { counts: countsOverride ?? counts }) } as never);
  jest.mocked(getDocs).mockImplementation((async (parts: Filter[]) => {
    const filters = parts.filter((part) => part.field);
    const value = (field: string) => filters.find((filter) => filter.field === field)!.value;
    const [category, difficulty] = [value('compass.category') as Category, value('difficulty') as Difficulty];
    const numbers = value('n') as number[];
    expect(filters.find((filter) => filter.field === 'n')!.op).toBe('in');
    expect(numbers.length).toBeLessThanOrEqual(30);
    return {
      docs: numbers.map((n) => {
        const place = groups[`${category}|${difficulty}`][n - 1];
        return { data: (): PlaceDoc => ({ ...place, difficulty, n, compass: { category } }) };
      }),
    };
  }) as never);
};

const fake = (name: string, code: string, latitude: number, longitude: number): Fake => ({ name, code, latitude, longitude });
const far = (count: number, prefix = 'P', code = 'IT'): Fake[] =>
  Array.from({ length: count }, (_, index) => fake(`${prefix}${index}`, code, 40, 10 + index / 100));
const ORIGIN = { latitude: 48.85, longitude: 2.35 };
const settings: GameSettings = { ...DEFAULT_SETTINGS, categories: ['cities', 'capital'], difficulty: 'easy', rounds: 3 };
const names = (places: { name: string }[]) => places.map((place) => place.name);
const queriedNumbers = () => jest.mocked(getDocs).mock.calls.flatMap(([parts]) => (parts as unknown as Filter[]).filter((part) => part.field === 'n').flatMap((part) => part.value as number[]));

beforeEach(() => {
  jest.clearAllMocks();
  clearCompassHistory();
});

describe('fetchRandomPlaces', () => {
  it('reads the group sizes once, then only the drawn positions of the selected groups', async () => {
    installDb({ 'cities|easy': far(20, 'C'), 'capital|easy': far(10, 'K'), 'nature|easy': far(50, 'N'), 'cities|hard': far(50, 'H') });

    const places = await fetchRandomPlaces(ORIGIN, settings, 'fr');

    expect(places).toHaveLength(3);
    expect(new Set(names(places)).size).toBe(3);
    expect(names(places).every((name) => name.startsWith('C') || name.startsWith('K'))).toBe(true);
    expect(getDoc).toHaveBeenCalledTimes(1);
    // 3 rounds x 3 = 9 positions drawn on the first pass, all distinct.
    expect(queriedNumbers()).toHaveLength(9);
  });

  it('splits a group into chunks of 30 numbers (Firestore caps an `in` filter)', async () => {
    installDb({ 'cities|easy': far(200, 'C') });

    const places = await fetchRandomPlaces(ORIGIN, { ...settings, categories: ['cities'], rounds: 12 }, 'fr');

    expect(places).toHaveLength(12);
    // 12 x 3 = 36 positions -> 30 + 6.
    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(2);
  });

  it('drops the places too close to the starting point and keeps drawing when needed', async () => {
    installDb({ 'cities|easy': [...far(57, 'N', 'FR').map((place) => ({ ...place, latitude: 48.85, longitude: 2.35 })), ...far(3, 'F')] });

    const places = await fetchRandomPlaces(ORIGIN, { ...settings, categories: ['cities'] }, 'fr');

    expect(names(places).every((name) => name.startsWith('F'))).toBe(true);
    // 3 x 3 = 9 positions on the first pass (all 3 far places in it: about 1 chance in 400), then 18, 36.
    expect(jest.mocked(getDocs).mock.calls.length).toBeGreaterThan(1);
  });

  it('completes with the nearest-excluded places when too few are far enough', async () => {
    const near = far(10, 'N', 'FR').map((place, index) => ({ ...place, latitude: 48.85 + index / 1000, longitude: 2.35 }));
    installDb({ 'cities|easy': [...near, fake('Far', 'IT', 40, 10)] });

    const places = await fetchRandomPlaces(ORIGIN, { ...settings, categories: ['cities'] }, 'fr');

    expect(places).toHaveLength(3);
    expect(names(places)).toContain('Far');
    expect(names(places).filter((name) => name.startsWith('N'))).toHaveLength(2);
  });

  it('draws from the tier below in English and keeps only the French places bumped to the requested tier', async () => {
    installDb({
      'cities|intermediate': far(5, 'I'),
      'cities|easy': [...far(3, 'FR', 'FR').map((place) => ({ ...place, latitude: 0, longitude: 0 })), ...far(20, 'E')],
    });

    const places = await fetchRandomPlaces({ latitude: -80, longitude: 100 }, { ...settings, categories: ['cities'], difficulty: 'intermediate', rounds: 8 }, 'en');

    // Only 5 intermediate + the 3 French "easy" places (bumped to intermediate in English) qualify: exactly the 8 rounds.
    expect(names(places).sort()).toEqual(['FR0', 'FR1', 'FR2', 'I0', 'I1', 'I2', 'I3', 'I4']);
  });

  it('reads the whole pool when needed instead of giving up early', async () => {
    installDb({ 'cities|easy': far(9, 'C') });

    expect(await fetchRandomPlaces(ORIGIN, { ...settings, categories: ['cities'], rounds: 9 }, 'fr')).toHaveLength(9);
  });

  it('stops after a few passes when there are enough places but too close ones', async () => {
    installDb({ 'cities|easy': far(300, 'C', 'FR').map((place) => ({ ...place, latitude: 48.85, longitude: 2.35 })) });

    const places = await fetchRandomPlaces(ORIGIN, { ...settings, categories: ['cities'] }, 'fr');

    expect(places).toHaveLength(3);
    // 9 + 18 + 36 positions: three passes, not the whole 300-place pool.
    expect(queriedNumbers()).toHaveLength(63);
  });


  it('takes places never played on this device first, then starts the cycle over once all were seen', async () => {
    installDb({ 'cities|easy': far(6, 'C') });
    const game = { ...settings, categories: ['cities'] as const };

    const first = names(await fetchRandomPlaces(ORIGIN, { ...game, categories: [...game.categories] }, 'fr'));
    const second = names(await fetchRandomPlaces(ORIGIN, { ...game, categories: [...game.categories] }, 'fr'));

    // 6 places, 3 per game: the second game is exactly the 3 the first one did not use.
    expect(new Set([...first, ...second]).size).toBe(6);
    // Everything was seen: the history is forgotten and a third game can use any place again.
    expect(await fetchRandomPlaces(ORIGIN, { ...game, categories: [...game.categories] }, 'fr')).toHaveLength(3);
  });

  it('completes with already played places when too few new ones remain', async () => {
    installDb({ 'cities|easy': far(4, 'C') });
    const game = { ...settings, categories: ['cities' as Category] };

    const first = names(await fetchRandomPlaces(ORIGIN, game, 'fr'));
    const second = names(await fetchRandomPlaces(ORIGIN, game, 'fr'));

    // 4 places: the one left over comes first, the 2 others are replays.
    const missing = ['C0', 'C1', 'C2', 'C3'].find((name) => !first.includes(name))!;
    expect(second).toContain(missing);
  });

  it('rejects when fewer than the requested rounds exist in the selected groups', async () => {
    installDb({ 'cities|easy': far(2, 'C'), 'nature|easy': far(50, 'N') });

    await expect(fetchRandomPlaces(ORIGIN, { ...settings, categories: ['cities'] }, 'fr')).rejects.toThrow('Not enough places');
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('rejects when the counts document does not exist', async () => {
    installDb({ 'cities|easy': far(10, 'C') }, null);

    await expect(fetchRandomPlaces(ORIGIN, settings, 'fr')).rejects.toThrow('Not enough places');
  });

  it('rejects when the drawn places do not match after filtering the whole pool', async () => {
    installDb({ 'cities|easy': far(10, 'E') });

    // English, intermediate: the pool includes the tier below, but no place there is French.
    await expect(
      fetchRandomPlaces(ORIGIN, { ...settings, categories: ['cities'], difficulty: 'intermediate' }, 'en'),
    ).rejects.toThrow('Not enough places');
  });

  it('rejects when Firestore fails', async () => {
    jest.mocked(getDoc).mockRejectedValue(new Error('offline'));

    await expect(fetchRandomPlaces(ORIGIN, settings, 'fr')).rejects.toThrow('offline');
  });
});
