import { getDocs } from 'firebase/firestore';

import { encodeRing } from '@/data/firestore/polyline';
import type { ContourCountryDoc } from '@/data/firestore/types';

import { loadContourCounts } from './contourCounts';
import { loadContourCursors, saveContourCursors } from './contourCursors';
import { clearContourDocuments, fetchContourRoundCodes, loadRoundData } from './firestoreContours';

type Filter = { field: string; op: string; value: unknown };

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'contours'),
  documentId: jest.fn(() => '__name__'),
  getDocs: jest.fn(),
  query: jest.fn((_collection: unknown, ...filters: unknown[]) => filters),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));
jest.mock('@/helpers/firebase', () => ({ db: {} }));
jest.mock('./contourCounts', () => ({ loadContourCounts: jest.fn() }));
jest.mock('./contourCursors', () => ({ loadContourCursors: jest.fn(), saveContourCursors: jest.fn() }));

const doc = (overrides: Partial<ContourCountryDoc> = {}): ContourCountryDoc => ({
  fr: 'Pays',
  en: 'Country',
  points: [0, 0, 1, 0, 1, 1, 0, 0],
  difficulty: 'intermediate',
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors: [],
  borderCodes: [],
  ...overrides,
});

/** A fake `contours` collection: `byDifficulty.intermediate[n - 1]` is the country numbered `n` there. */
const installDb = (byDifficulty: Record<string, string[]>, byCode: Record<string, ContourCountryDoc> = {}) => {
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
  const FRANCE = doc({ borderCodes: ['ES', 'XX'], fr: 'France', en: 'France' });
  const SPAIN = doc({ fr: 'Espagne', en: 'Spain' });

  it("reads the country's document, then those of the countries around it", async () => {
    installDb({}, { FR: FRANCE, ES: SPAIN });

    const round = await loadRoundData('FR');

    expect(round.country.code).toBe('FR');
    expect(round.country.fr).toBe('France');
    // A neighbor without a silhouette is just not drawn.
    expect(round.neighborCountries.map((country) => country.code)).toEqual(['ES']);
    expect(getDocs).toHaveBeenCalledTimes(2);
  });

  it('reads ONE document when it carries the outline of its neighbours', async () => {
    const migrated = doc({
      borderCodes: ['ES'],
      ring: encodeRing([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ]),
      neighborRings: {
        ES: encodeRing([
          [1, 0],
          [2, 0],
          [2, 1],
          [1, 0],
        ]),
      },
    });
    installDb({}, { FR: migrated });

    const round = await loadRoundData('FR');

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(round.country.points).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ]);
    expect(round.neighborCountries.map(({ code, points }) => [code, points])).toEqual([
      [
        'ES',
        [
          [1, 0],
          [2, 0],
          [2, 1],
          [1, 0],
        ],
      ],
    ]);
  });

  it('keeps what it read: the same round again, or another one around the same countries, reads nothing more', async () => {
    installDb({}, { FR: FRANCE, ES: SPAIN, PT: doc({ borderCodes: ['ES', 'XX'] }) });

    const first = await loadRoundData('FR');
    expect(await loadRoundData('FR')).toBe(first);
    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(2);

    await loadRoundData('PT');
    // PT itself: one query; ES and the absent XX are already known.
    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(3);
  });

  it('reads a country with many borders in queries of 30 documents', async () => {
    const codes = Array.from({ length: 35 }, (_, index) => `B${index}`);
    installDb({}, { RU: doc({ borderCodes: codes }), ...Object.fromEntries(codes.map((code) => [code, doc()])) });

    const round = await loadRoundData('RU');

    expect(round.neighborCountries).toHaveLength(35);
    // The country, then 30 + 5 neighbors.
    expect(jest.mocked(getDocs)).toHaveBeenCalledTimes(3);
  });

  it('rejects for a country without a document, and forgets the failure', async () => {
    installDb({}, {});
    await expect(loadRoundData('ZZ')).rejects.toThrow('No silhouette for ZZ');

    installDb({}, { ZZ: doc() });
    clearContourDocuments();
    expect((await loadRoundData('ZZ')).country.code).toBe('ZZ');
  });

  it('tries again after a failed read', async () => {
    jest.mocked(getDocs).mockRejectedValueOnce(new Error('offline'));
    await expect(loadRoundData('FR')).rejects.toThrow('offline');

    installDb({}, { FR: FRANCE, ES: SPAIN });
    expect((await loadRoundData('FR')).country.code).toBe('FR');
  });
});
