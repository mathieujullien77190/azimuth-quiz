import { getDocs } from 'firebase/firestore';

import { encodeRing } from '@/data/firestore/polyline';
import type { CountryDoc } from '@/data/firestore/types';

import { loadContourCounts } from './contourCounts';
import { loadContourCursors, saveContourCursors } from './contourCursors';
import { clearContourDocuments, fetchContourRoundCodes, loadRoundData } from './firestoreContours';

type Filter = { field: string; op: string; value: unknown };

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'countries'),
  documentId: jest.fn(() => '__name__'),
  getDocs: jest.fn(),
  query: jest.fn((_collection: unknown, ...filters: unknown[]) => filters),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));
jest.mock('@/helpers/firebase', () => ({ db: {} }));
jest.mock('./contourCounts', () => ({ loadContourCounts: jest.fn() }));
jest.mock('./contourCursors', () => ({ loadContourCursors: jest.fn(), saveContourCursors: jest.fn() }));

const SQUARE = encodeRing([
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 0],
]);

const doc = (overrides: Partial<CountryDoc> = {}): CountryDoc => ({
  fr: 'Pays',
  en: 'Country',
  ring: SQUARE,
  difficulty: 'intermediate',
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors: [],
  ...overrides,
});

/** A fake `countries` collection: `byDifficulty.intermediate[n - 1]` is the country numbered `n` there. */
const installDb = (byDifficulty: Record<string, string[]>, byCode: Record<string, CountryDoc> = {}) => {
  jest.mocked(getDocs).mockImplementation((async (filters: Filter[]) => {
    const value = (field: string) => filters.find((filter) => filter.field === field)?.value;
    const numbers = value('n') as number[] | undefined;
    if (numbers) {
      const codes = byDifficulty[value('difficulty') as string];
      return {
        docs: numbers.flatMap((n) => (codes[n - 1] ? [{ id: codes[n - 1], data: () => doc() }] : [])),
      };
    }
    const ids = value('__name__') as string[];
    expect(ids.length).toBeLessThanOrEqual(30);
    return { docs: ids.filter((id) => byCode[id]).map((id) => ({ id, data: () => byCode[id] })) };
  }) as never);
};

const queriedNumbers = () =>
  jest.mocked(getDocs).mock.calls.flatMap(([filters]) => {
    const found = (filters as unknown as Filter[]).find((filter) => filter.field === 'n');
    return found ? (found.value as number[]) : [];
  });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  clearContourDocuments();
  jest.mocked(loadContourCounts).mockResolvedValue({ intermediate: 6, easy: 2 });
  jest.mocked(loadContourCursors).mockResolvedValue({});
});

const SIX = ['AA', 'BB', 'CC', 'DD', 'EE', 'FF'];

describe('fetchContourRoundCodes', () => {
  it('takes the next countries from the cursor of the difficulty, wrapping at the end, and moves the cursor on', async () => {
    installDb({ intermediate: SIX });
    jest.mocked(loadContourCursors).mockResolvedValue({ intermediate: 4 });

    const codes = await fetchContourRoundCodes({ difficulty: 'intermediate', rounds: 4 });

    // Positions 4, 5, 0, 1 -> numbers 5, 6, 1, 2.
    expect(queriedNumbers()).toEqual([5, 6, 1, 2]);
    expect([...codes].sort()).toEqual(['AA', 'BB', 'EE', 'FF']);
    expect(saveContourCursors).toHaveBeenCalledWith({ intermediate: 2 });
  });

  it('starts at a random country the first time', async () => {
    installDb({ intermediate: SIX });
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    await fetchContourRoundCodes({ difficulty: 'intermediate', rounds: 2 });

    // floor(0.5 x 6) = 3 -> numbers 4 and 5.
    expect(queriedNumbers()).toEqual([4, 5]);
    expect(saveContourCursors).toHaveBeenCalledWith({ intermediate: 5 });
  });

  it('reads a group of exactly the rounds from the top of it', async () => {
    installDb({ easy: ['XX', 'YY'] });
    jest.mocked(loadContourCursors).mockResolvedValue({ easy: 2 });

    const codes = await fetchContourRoundCodes({ difficulty: 'easy', rounds: 2 });

    // A cursor at the end of the group wraps to its start.
    expect(queriedNumbers()).toEqual([1, 2]);
    expect([...codes].sort()).toEqual(['XX', 'YY']);
    expect(saveContourCursors).toHaveBeenCalledWith({ easy: 0 });
  });

  it('asks again for the numbers that have no document', async () => {
    // The sizes say 6 but the admin removed the countries 2 and 3.
    installDb({ intermediate: ['AA', '', '', 'DD', 'EE', 'FF'] });
    jest.mocked(loadContourCursors).mockResolvedValue({ intermediate: 0 });

    const codes = await fetchContourRoundCodes({ difficulty: 'intermediate', rounds: 3 });

    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(2);
    expect(queriedNumbers()).toEqual([1, 2, 3, 4, 5]);
    expect([...codes].sort()).toEqual(['AA', 'DD', 'EE']);
    expect(saveContourCursors).toHaveBeenCalledWith({ intermediate: 5 });
  });

  it('splits a long draw in queries of 30 numbers', async () => {
    const many = Array.from({ length: 40 }, (_, index) => `C${index}`);
    installDb({ intermediate: many });
    jest.mocked(loadContourCounts).mockResolvedValue({ intermediate: 40 });
    jest.mocked(loadContourCursors).mockResolvedValue({ intermediate: 0 });

    const codes = await fetchContourRoundCodes({ difficulty: 'intermediate', rounds: 35 });

    expect(codes).toHaveLength(35);
    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(2);
  });

  it('goes through a group smaller than the rounds again, never the same country twice in a row', async () => {
    installDb({ easy: ['AA', 'BB'] });
    const codes = await fetchContourRoundCodes({ difficulty: 'easy', rounds: 5 });

    expect(codes).toHaveLength(5);
    expect(new Set(codes)).toEqual(new Set(['AA', 'BB']));
    codes.slice(1).forEach((code, index) => expect(code).not.toBe(codes[index]));
    // The whole group was gone through once: the cursor is back where it started.
    expect(saveContourCursors).toHaveBeenCalledTimes(1);
  });

  it('turns a round around when it would start with the country the last one ended with', async () => {
    installDb({ easy: ['AA', 'BB'] });
    // Start at random (0), then two shuffles: [AA, BB] (0.99 keeps the order) and [BB, AA] (0 swaps them).
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValue(0.99);

    expect(await fetchContourRoundCodes({ difficulty: 'easy', rounds: 4 })).toEqual(['AA', 'BB', 'AA', 'BB']);

    jest.spyOn(Math, 'random').mockRestore();
  });

  it('repeats the only country of a group of one', async () => {
    jest.mocked(loadContourCounts).mockResolvedValue({ hard: 1 });
    installDb({ hard: ['ZZ'] });

    expect(await fetchContourRoundCodes({ difficulty: 'hard', rounds: 3 })).toEqual(['ZZ', 'ZZ', 'ZZ']);
  });

  it('rejects, without moving the cursor, when the group has no country', async () => {
    await expect(fetchContourRoundCodes({ difficulty: 'hard', rounds: 1 })).rejects.toThrow('Not enough countries');
    expect(getDocs).not.toHaveBeenCalled();
    expect(saveContourCursors).not.toHaveBeenCalled();
  });

  it('rejects when too few countries exist in the end', async () => {
    installDb({ intermediate: ['AA', '', '', '', '', ''] });

    await expect(fetchContourRoundCodes({ difficulty: 'intermediate', rounds: 3 })).rejects.toThrow(
      'Not enough countries',
    );
    expect(saveContourCursors).not.toHaveBeenCalled();
  });
});

describe('loadRoundData', () => {
  const ES_RING = encodeRing([
    [1, 0],
    [2, 0],
    [2, 1],
    [1, 0],
  ]);
  const FRANCE = doc({
    fr: 'France',
    en: 'France',
    neighbors: [
      { code: 'ES', fr: 'Espagne', en: 'Spain', ring: ES_RING, x: 0.1, y: 0.9 },
      { code: 'BE', fr: 'Belgique', en: 'Belgium', ring: SQUARE },
      { code: 'GB', fr: 'Royaume-Uni', en: 'United Kingdom', x: 0.5, y: 0.1 },
    ],
    capital: { name: 'Paris', lon: 2.35, lat: 48.85 },
    cities: [{ name: 'Lyon', lon: 4.83, lat: 45.76 }],
  });

  it('reads ONE document: the outline, the hints, the backdrop, the capital and the cities are all in it', async () => {
    installDb({}, { FR: FRANCE });

    const round = await loadRoundData('FR');

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(round.country).toMatchObject({ code: 'FR', fr: 'France', en: 'France', difficulty: 'intermediate' });
    expect(round.country.points).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ]);
    // The hints are the neighbours with a position, whether they have an outline or not.
    expect(round.country.neighbors.map(({ code, fr, x, y }) => [code, fr, x, y])).toEqual([
      ['ES', 'Espagne', 0.1, 0.9],
      ['GB', 'Royaume-Uni', 0.5, 0.1],
    ]);
    // The backdrop is the neighbours with an outline, whether they are a hint or not.
    expect(round.neighborCountries.map(({ code }) => code)).toEqual(['ES', 'BE']);
    expect(round.neighborCountries[0].points).toEqual([
      [1, 0],
      [2, 0],
      [2, 1],
      [1, 0],
    ]);
    expect(round.country.capital).toEqual({ name: 'Paris', longitude: 2.35, latitude: 48.85 });
    expect(round.country.cities).toEqual([{ name: 'Lyon', longitude: 4.83, latitude: 45.76 }]);
  });

  it('keeps what it read: the same round again reads nothing more, another round reads its own document', async () => {
    installDb({}, { FR: FRANCE, PT: doc() });

    const first = await loadRoundData('FR');
    expect(await loadRoundData('FR')).toBe(first);
    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(1);

    await loadRoundData('PT');
    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(2);
  });

  it('reads nothing more for a country the draw already brought whole', async () => {
    installDb({ intermediate: SIX });
    const codes = await fetchContourRoundCodes({ difficulty: 'intermediate', rounds: 2 });
    const reads = jest.mocked(getDocs).mock.calls.length;

    const round = await loadRoundData(codes[0]);

    expect(round.country.code).toBe(codes[0]);
    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(reads);
  });

  it('rejects for a country without a document or without a silhouette, and forgets the failure', async () => {
    installDb({}, {});
    await expect(loadRoundData('ZZ')).rejects.toThrow('No silhouette for ZZ');

    installDb({}, { ZZ: { fr: 'Zed', en: 'Zed' } });
    clearContourDocuments();
    await expect(loadRoundData('ZZ')).rejects.toThrow('No silhouette for ZZ');

    installDb({}, { ZZ: doc() });
    clearContourDocuments();
    expect((await loadRoundData('ZZ')).country.code).toBe('ZZ');
  });

  it('tries again after a failed read', async () => {
    jest.mocked(getDocs).mockRejectedValueOnce(new Error('offline'));
    await expect(loadRoundData('FR')).rejects.toThrow('offline');

    installDb({}, { FR: FRANCE });
    expect((await loadRoundData('FR')).country.code).toBe('FR');
  });
});
