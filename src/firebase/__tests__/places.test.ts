import { getDoc, getDocs } from 'firebase/firestore';

import type { Counts, PlaceDoc } from '@/firebase/types';
import { DEFAULT_SETTINGS } from '@/data/game';
import type { Category, Difficulty, GameSettings } from '@/types';

import { clearCounts } from '../groupCounts';
import { clearCursors, loadCursors, saveCursors } from '@/helpers/groupCursors';
import { fetchRandomPlaces } from '../places';

type Filter = { field: string; op: string; value: unknown };
type Composite = { type: 'and' | 'or'; filters: (Filter | Composite)[] };

/** Les clauses `and(...)` du filtre d'une requete : un `or` d'elles, ou une seule. */
const clausesOf = (filter: Filter | Composite): Filter[][] =>
  'type' in filter && filter.type === 'or'
    ? filter.filters.map((clause) => (clause as Composite).filters as Filter[])
    : [(filter as Composite).filters as Filter[]];

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'places'),
  doc: jest.fn(() => 'countsRef'),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((_collection: unknown, filter: unknown) => filter),
  and: jest.fn((...filters: unknown[]) => ({ type: 'and', filters })),
  or: jest.fn((...filters: unknown[]) => ({ type: 'or', filters })),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));
jest.mock('@/firebase/client', () => ({ db: {} }));

type Fake = { name: string; code: string; latitude: number; longitude: number };

/** Fausse collection `places` : `groups['cities|easy'][n - 1]` est le lieu numero `n` du groupe. */
const installDb = (groups: Record<string, Fake[]>, countsOverride?: Counts | null) => {
  const counts: Counts = {};
  for (const [id, places] of Object.entries(groups)) {
    const [category, difficulty] = id.split('|') as [Category, Difficulty];
    counts[category] = { ...counts[category], [difficulty]: places.length };
  }
  jest.mocked(getDoc).mockResolvedValue({
    data: () => (countsOverride === null ? undefined : { counts: countsOverride ?? counts }),
  } as never);
  jest.mocked(getDocs).mockImplementation((async (filter: Filter | Composite) => {
    const docs = clausesOf(filter).flatMap((filters) => {
      const value = (field: string) => filters.find((entry) => entry.field === field)!.value;
      const [category, difficulty] = [value('compass.category') as Category, value('difficulty') as Difficulty];
      expect(filters.find((entry) => entry.field === 'n')!.op).toBe('in');
      return (value('n') as number[]).map((n) => {
        const place = groups[`${category}|${difficulty}`][n - 1];
        return { id: `${category}${difficulty}${n}`, data: (): PlaceDoc => ({ ...place, difficulty, n, compass: { category } }) };
      });
    });
    // Firestore plafonne a 30 les valeurs d'un `or`/`in` par requete.
    expect(docs.length).toBeLessThanOrEqual(30);
    return { docs };
  }) as never);
};

const fake = (name: string, code: string, latitude: number, longitude: number): Fake => ({
  name,
  code,
  latitude,
  longitude,
});
const far = (count: number, prefix = 'P', code = 'IT'): Fake[] =>
  Array.from({ length: count }, (_, index) => fake(`${prefix}${index}`, code, 40, 10 + index / 100));
const settings: GameSettings = {
  ...DEFAULT_SETTINGS,
  categories: ['cities', 'capital'],
  difficulty: 'easy',
  rounds: 3,
};
const names = (places: { name: string }[]) => places.map((place) => place.name);
const queriedNumbers = () =>
  jest
    .mocked(getDocs)
    .mock.calls.flatMap(([filter]) => clausesOf(filter as unknown as Filter | Composite))
    .flatMap((filters) => filters.filter((entry) => entry.field === 'n').flatMap((entry) => entry.value as number[]));

let randomSpy: jest.SpyInstance | undefined;
/** Fait renvoyer ces valeurs a Math.random tour a tour (puis en boucle) : tirage previsible. */
const useRandom = (...values: number[]) => {
  let index = 0;
  randomSpy = jest.spyOn(Math, 'random').mockImplementation(() => values[index++ % values.length]);
};

beforeEach(() => {
  jest.clearAllMocks();
  // Le tirage loggue ce que Firestore renvoie : on garde la sortie des tests propre.
  jest.spyOn(console, 'log').mockImplementation(() => {});
  clearCursors();
  clearCounts();
});

afterEach(() => {
  randomSpy?.mockRestore();
  randomSpy = undefined;
});

describe('fetchRandomPlaces', () => {
  it('takes exactly the rounds, in ONE query across the selected groups', async () => {
    installDb({
      'cities|easy': far(20, 'C'),
      'capital|easy': far(10, 'K'),
      'nature|easy': far(50, 'N'),
      'cities|hard': far(50, 'H'),
    });
    saveCursors({ 'cities|easy': 0, 'capital|easy': 0 });

    const places = await fetchRandomPlaces(settings, 'fr');

    expect(places).toHaveLength(3);
    // Chaque lieu connait l'id de son document (les avis du mode dev y renvoient).
    expect(places.every((place) => typeof place.key === 'string' && place.key.length > 0)).toBe(true);
    expect(new Set(names(places)).size).toBe(3);
    expect(names(places).every((name) => name.startsWith('C') || name.startsWith('K'))).toBe(true);
    // Plusieurs groupes, une seule requete (un `or` par groupe) ramene tous les documents.
    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(getDoc).toHaveBeenCalledTimes(1);
    // Francais : toutes les positions prises sont gardees, donc exactement 3 lectures.
    expect(queriedNumbers()).toHaveLength(3);
  });

  it('starts at a random place the first time, then goes on from the cursor and wraps at the end', async () => {
    installDb({ 'cities|easy': far(10, 'C') });
    const game = { ...settings, categories: ['cities' as Category] };

    useRandom(0.5);
    // Depart aleatoire : floor(0.5 x 10) = position 5 -> 6e, 7e et 8e lieux.
    expect(names(await fetchRandomPlaces(game, 'fr')).sort()).toEqual(['C5', 'C6', 'C7']);
    expect(await loadCursors()).toEqual({ 'cities|easy': 8 });
    randomSpy?.mockRestore();

    // Partie suivante : les lieux suivants, en bouclant (9e, 10e, puis 1er).
    expect(names(await fetchRandomPlaces(game, 'fr')).sort()).toEqual(['C0', 'C8', 'C9']);
    expect(await loadCursors()).toEqual({ 'cities|easy': 1 });
  });

  it('goes through a whole group before any place comes back', async () => {
    installDb({ 'cities|easy': far(4, 'C') });
    saveCursors({ 'cities|easy': 0 });
    const game = { ...settings, categories: ['cities' as Category], rounds: 2 };

    const first = names(await fetchRandomPlaces(game, 'fr'));
    const second = names(await fetchRandomPlaces(game, 'fr'));
    const third = names(await fetchRandomPlaces(game, 'fr'));

    expect([...first].sort()).toEqual(['C0', 'C1']);
    expect([...second].sort()).toEqual(['C2', 'C3']);
    expect([...third].sort()).toEqual(['C0', 'C1']);
  });

  it('keeps working with a cursor that is past the end of a group that shrank', async () => {
    installDb({ 'cities|easy': far(10, 'C') });
    saveCursors({ 'cities|easy': 25 });

    const places = await fetchRandomPlaces({ ...settings, categories: ['cities'] }, 'fr');

    expect(names(places).sort()).toEqual(['C5', 'C6', 'C7']);
    expect(await loadCursors()).toEqual({ 'cities|easy': 8 });
  });

  it('splits the rounds over the groups at random, weighted by size, each group from its own cursor', async () => {
    installDb({ 'cities|easy': far(10, 'C'), 'capital|easy': far(10, 'K') });
    saveCursors({ 'cities|easy': 0, 'capital|easy': 5 });

    // 0.1 x 20 tombe dans le 1er groupe, 0.9 x 20 dans le 2e : ils alternent.
    useRandom(0.1, 0.9);
    const places = await fetchRandomPlaces({ ...settings, rounds: 4 }, 'fr');

    expect(names(places).sort()).toEqual(['C0', 'C1', 'K5', 'K6']);
    expect(await loadCursors()).toEqual({ 'cities|easy': 2, 'capital|easy': 7 });
  });

  it('splits a long read into queries of 30 numbers (Firestore caps an `or` at 30 values)', async () => {
    installDb({ 'cities|easy': far(200, 'C') });
    saveCursors({ 'cities|easy': 0 });

    const places = await fetchRandomPlaces({ ...settings, categories: ['cities'], rounds: 32 }, 'fr');

    expect(places).toHaveLength(32);
    // 32 positions -> 30 + 2.
    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(2);
  });

  it('draws from the tier below in English and keeps only the French places bumped to the requested tier', async () => {
    installDb({
      'cities|intermediate': far(5, 'I'),
      'cities|easy': [...far(3, 'FR', 'FR'), ...far(4, 'E')],
    });

    const places = await fetchRandomPlaces(
      { ...settings, categories: ['cities'], difficulty: 'intermediate', rounds: 8 },
      'en',
    );

    // 5 intermediaires + les 3 lieux francais "easy" (releves en anglais) : exactement 8 manches.
    expect(names(places).sort()).toEqual(['FR0', 'FR1', 'FR2', 'I0', 'I1', 'I2', 'I3', 'I4']);
  });

  it('takes more places in a second pass when the first one was mostly filtered out', async () => {
    installDb({
      'cities|intermediate': far(5, 'I'),
      // Les 3 lieux francais viennent en dernier : le 1er passage (24 lieux) les rate.
      'cities|easy': [...far(37, 'E'), ...far(3, 'FR', 'FR')],
    });
    saveCursors({ 'cities|intermediate': 0, 'cities|easy': 0 });

    // Random 0 prend toujours le 1er groupe non epuise : les 5 intermediaires, puis les faciles.
    useRandom(0);
    const places = await fetchRandomPlaces(
      { ...settings, categories: ['cities'], difficulty: 'intermediate', rounds: 8 },
      'en',
    );

    expect(names(places).sort()).toEqual(['FR0', 'FR1', 'FR2', 'I0', 'I1', 'I2', 'I3', 'I4']);
    expect(getDocs).toHaveBeenCalledTimes(2);
    // Tout lieu pris compte comme parcouru, aussi ceux lus puis ecartes : les deux groupes ont fait un
    // tour.
    expect(await loadCursors()).toEqual({ 'cities|intermediate': 0, 'cities|easy': 0 });
  });

  it('rejects when fewer than the requested rounds exist in the selected groups', async () => {
    installDb({ 'cities|easy': far(2, 'C'), 'nature|easy': far(50, 'N') });

    await expect(fetchRandomPlaces({ ...settings, categories: ['cities'] }, 'fr')).rejects.toThrow('Not enough places');
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('rejects when the counts document does not exist', async () => {
    installDb({ 'cities|easy': far(10, 'C') }, null);

    await expect(fetchRandomPlaces(settings, 'fr')).rejects.toThrow('Not enough places');
  });

  it('rejects, cursors untouched, when the whole pool is read and too few places match', async () => {
    installDb({ 'cities|easy': far(10, 'E') });

    // Anglais, intermediaire : le pool inclut le palier inferieur, mais aucun lieu n'y est francais.
    await expect(
      fetchRandomPlaces({ ...settings, categories: ['cities'], difficulty: 'intermediate' }, 'en'),
    ).rejects.toThrow('Not enough places');
    expect(await loadCursors()).toEqual({});
  });

  it('rejects when Firestore fails', async () => {
    jest.mocked(getDoc).mockRejectedValue(new Error('offline'));

    await expect(fetchRandomPlaces(settings, 'fr')).rejects.toThrow('offline');
  });
});
