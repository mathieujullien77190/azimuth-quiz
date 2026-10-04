import { getDoc, getDocs } from 'firebase/firestore';

import type { CompassCounts, PlaceDoc } from '@/data/firestore/types';
import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import type { ClueCategory, ClueSettings, Difficulty } from '@/types';

import { clearCluesCounts } from './clueCounts';
import { clearClueCursors, loadClueCursors } from './clueCursors';
import { fetchClueRoundPlaces } from './firestoreCluePlaces';

type Filter = { field: string; op: string; value: unknown };
type Composite = { type: 'and' | 'or'; filters: (Filter | Composite)[] };

/** The `and(...)` clauses of a query's filter: an `or` of them, or a lone one. */
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
jest.mock('@/helpers/firebase', () => ({ db: {} }));

/** A fake `places` collection: `groups['capital|easy'][n - 1]` is the Clues place numbered `n` in that group,
 * stored the way the admin writes it (country copy, job label in the
 * personality). */
const installDb = (groups: Record<string, string[]>, countsOverride?: CompassCounts | null) => {
  const counts: CompassCounts = {};
  for (const [id, names] of Object.entries(groups)) {
    const [category, difficulty] = id.split('|') as [ClueCategory, Difficulty];
    counts[category] = { ...counts[category], [difficulty]: names.length };
  }
  jest.mocked(getDoc).mockResolvedValue({
    data: () => (countsOverride === null ? undefined : { counts: countsOverride ?? counts }),
  } as never);
  jest.mocked(getDocs).mockImplementation((async (filter: Filter | Composite) => {
    const docs = clausesOf(filter).flatMap((filters) => {
      const value = (field: string) => filters.find((entry) => entry.field === field)!.value;
      const [category, difficulty] = [value('clues.category') as ClueCategory, value('difficulty') as Difficulty];
      expect(filters.find((entry) => entry.field === 'clues.n')!.op).toBe('in');
      return (value('clues.n') as number[]).map((n) => {
        const name = groups[`${category}|${difficulty}`][n - 1];
        return {
          id: name.toLowerCase(),
          data: (): PlaceDoc => ({
            name,
            code: 'IT',
            latitude: 41,
            longitude: 12,
            difficulty,
            country: {
              fr: 'Italie',
              en: 'Italy',
              flag: [{ id: 'green', hex: '#008C45', percent: 33 }],
              currency: 'Euro',
              currencySymbol: '€',
              phoneCode: '+39',
            },
            clues: {
              positionInCountry: 'n',
              population: 1000,
              climateEmoji: '☀️',
              elevationMeters: 10,
              timezone: 'Europe/Rome',
              airportCode: 'AAA',
              emojis: ['a', 'b', 'c'],
              category,
              n,
            },
            personality: { name: 'Jules', jobCode: 'emp', job: { fr: 'empereur', en: 'emperor' } },
            wordplay: { sentence: 'Une phrase.', difficulty: 'easy' },
          }),
        };
      });
    });
    // Firestore caps the values of one query's `or`/`in` at 30 in total.
    expect(docs.length).toBeLessThanOrEqual(30);
    return { docs };
  }) as never);
};

const list = (count: number, prefix: string): string[] =>
  Array.from({ length: count }, (_, index) => `${prefix}${index}`);
const settings: ClueSettings = {
  ...DEFAULT_CLUE_SETTINGS,
  categories: ['cities', 'capital', 'citiesFr'],
  difficulty: 'easy',
  rounds: 3,
};
const names = (places: { name: string }[]) => places.map((place) => place.name);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  clearClueCursors();
  clearCluesCounts();
});

describe('fetchClueRoundPlaces', () => {
  it('takes one place from each of the selected categories, in a single query, complete with what a round needs', async () => {
    installDb({ 'cities|easy': list(9, 'C'), 'capital|easy': list(9, 'K'), 'citiesFr|easy': list(9, 'F') });

    const places = await fetchClueRoundPlaces(settings, 'fr');

    expect(places).toHaveLength(3);
    expect(new Set(names(places).map((name) => name[0]))).toEqual(new Set(['C', 'K', 'F']));
    // The sizes were read once, then every place with ONE query (an `or` of one clause per group).
    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(places[0]).toMatchObject({
      country: 'Italie',
      phoneCode: '+39',
      currency: '€',
      currencyName: 'Euro',
      flagColors: [{ id: 'green', hex: '#008C45', percent: 33 }],
      wordplay: { sentence: 'Une phrase.', difficulty: 'easy' },
      personality: { name: 'Jules', description: 'empereur' },
    });
  });

  it('moves the cursor of each group on, so the next game goes on with the following places', async () => {
    installDb({ 'cities|easy': list(6, 'C') });
    const game = { ...settings, categories: ['cities' as const] };

    const first = names(await fetchClueRoundPlaces(game, 'fr'));
    const second = names(await fetchClueRoundPlaces(game, 'fr'));

    // 6 places, 3 per game, no repeat until the group has been gone through.
    expect(new Set([...first, ...second]).size).toBe(6);
    expect(Object.keys(await loadClueCursors())).toEqual(['cities|easy']);
  });

  it('keeps only the French places bumped to the requested tier in English, and reads the tier below', async () => {
    installDb({ 'cities|intermediate': list(4, 'I'), 'cities|easy': list(4, 'E') });

    await expect(
      fetchClueRoundPlaces({ ...settings, categories: ['cities'], difficulty: 'intermediate', rounds: 3 }, 'en'),
    ).resolves.toHaveLength(3);
    // The stored tiers read: the requested one and the one below.
    const tiers = jest
      .mocked(getDocs)
      .mock.calls.flatMap(([filter]) => clausesOf(filter as unknown as Filter | Composite))
      .map((filters) => filters.find((entry) => entry.field === 'difficulty')!.value);
    expect(new Set(tiers)).toEqual(new Set(['intermediate', 'easy']));
  });

  it('rejects when fewer places than rounds exist in the selected groups', async () => {
    installDb({ 'cities|easy': list(2, 'C') });

    await expect(fetchClueRoundPlaces({ ...settings, categories: ['cities'] }, 'fr')).rejects.toThrow(
      'Not enough places',
    );
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('rejects when the sizes document does not exist', async () => {
    installDb({ 'cities|easy': list(9, 'C') }, null);

    await expect(fetchClueRoundPlaces(settings, 'fr')).rejects.toThrow('Not enough places');
  });

  it('rejects when Firestore fails', async () => {
    jest.mocked(getDoc).mockRejectedValue(new Error('offline'));

    await expect(fetchClueRoundPlaces(settings, 'fr')).rejects.toThrow('offline');
  });
});
