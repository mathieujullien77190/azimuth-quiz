import type { Category, Difficulty } from '@/types';

import {
  CLUES_NUMBERING,
  cluesCategory,
  computeNumbering,
  planRegroup,
  shuffleRank,
  slotAt,
} from './numbering';
import type { PlaceDoc } from './types';

const place = (category: Category | null, difficulty: Difficulty = 'easy', n?: number): PlaceDoc => ({
  name: 'X',
  code: 'FR',
  latitude: 0,
  longitude: 0,
  difficulty,
  ...(category && { compass: { category } }),
  ...(n !== undefined && { n }),
});

describe('shuffleRank', () => {
  it('is stable for a key and spread over [0, 1)', () => {
    expect(shuffleRank('par')).toBe(shuffleRank('par'));
    expect(shuffleRank('par')).not.toBe(shuffleRank('lon'));
    const ranks = Array.from({ length: 200 }, (_, index) => shuffleRank(`key${index}`));
    expect(ranks.every((rank) => rank >= 0 && rank < 1)).toBe(true);
    expect(Math.min(...ranks)).toBeLessThan(0.1);
    expect(Math.max(...ranks)).toBeGreaterThan(0.9);
  });
});

describe('computeNumbering', () => {
  it('numbers each group 1..size in the shuffled order and ignores non-Compass places', () => {
    const { numbers, counts } = computeNumbering([
      ['a', place('cities')],
      ['b', place(null)],
      ['c', place('cities')],
      ['d', place('cities', 'hard')],
      ['e', place('capital')],
    ]);

    expect(Object.keys(numbers).sort()).toEqual(['a', 'c', 'd', 'e']);
    expect([numbers.a, numbers.c].sort()).toEqual([1, 2]);
    expect(numbers.a).toBe(shuffleRank('a') < shuffleRank('c') ? 1 : 2);
    expect([numbers.d, numbers.e]).toEqual([1, 1]);
    expect(counts).toEqual({ cities: { easy: 2, hard: 1 }, capital: { easy: 1 } });
  });

  it('is deterministic, dense and not in the import order', () => {
    const entries: [string, PlaceDoc][] = Array.from({ length: 40 }, (_, index) => [`p${index}`, place('cities')]);

    const first = computeNumbering(entries).numbers;
    const again = computeNumbering([...entries].reverse()).numbers;

    expect(again).toEqual(first);
    expect(Object.values(first).sort((a, b) => a - b)).toEqual(Array.from({ length: 40 }, (_, index) => index + 1));
    expect(entries.map(([key]) => first[key])).not.toEqual(Array.from({ length: 40 }, (_, index) => index + 1));
  });
});

describe('planRegroup', () => {
  const places = {
    a: place('cities', 'easy', 1),
    b: place('cities', 'easy', 2),
    c: place('cities', 'easy', 3),
    d: place('capital', 'easy', 1),
    e: place(null),
  };
  const counts = { cities: { easy: 3 }, capital: { easy: 1 } };

  it('changes nothing when the group stays the same', () => {
    expect(
      planRegroup(places, counts, 'b', { ...places.b, compass: { category: 'cities', description: 'x' } }),
    ).toEqual({ n: 2, moved: {}, counts });
    expect(planRegroup(places, counts, 'a', places.a).n).toBe(1);
    expect(
      planRegroup({ x: place('cities', 'easy') }, { cities: { easy: 1 } }, 'x', place('cities', 'easy')).n,
    ).toBeNull();
  });

  it('gives the freed number to the last place of the group the place leaves, and joins the new group last', () => {
    const plan = planRegroup(places, counts, 'a', { ...places.a, compass: { category: 'capital' } });

    expect(plan).toEqual({ n: 2, moved: { c: 1 }, counts: { cities: { easy: 2 }, capital: { easy: 2 } } });
  });

  it('moves nothing when the leaving place already was the last one', () => {
    const plan = planRegroup(places, counts, 'c', { ...places.c, difficulty: 'hard' });

    expect(plan).toEqual({ n: 1, moved: {}, counts: { cities: { easy: 2, hard: 1 }, capital: { easy: 1 } } });
  });

  it('does not move anything when the counts and the numbers disagree (nobody holds the last number)', () => {
    const plan = planRegroup(
      { a: place('cities', 'easy', 1), b: place('cities', 'easy', 2) },
      { cities: { easy: 3 } },
      'a',
      null,
    );

    expect(plan).toEqual({ n: null, moved: {}, counts: { cities: { easy: 2 } } });
  });

  it('drops an emptied group and a deleted place leaves without joining anything', () => {
    const plan = planRegroup(places, counts, 'd', null);

    expect(plan).toEqual({ n: null, moved: {}, counts: { cities: { easy: 3 } } });
  });

  it('ignores a place without Compass on both sides and numbers a place that just got Compass', () => {
    expect(planRegroup(places, counts, 'e', { ...places.e, difficulty: 'hard' })).toEqual({
      n: null,
      moved: {},
      counts,
    });
    expect(planRegroup(places, counts, 'e', { ...places.e, compass: { category: 'cities' } })).toEqual({
      n: 4,
      moved: {},
      counts: { cities: { easy: 4 }, capital: { easy: 1 } },
    });
  });

  it('keeps the counts of a group that never existed out of the way', () => {
    expect(planRegroup({}, {}, 'new', place('kids', 'hard'))).toEqual({
      n: 1,
      moved: {},
      counts: { kids: { hard: 1 } },
    });
  });
});

describe('slotAt', () => {
  const pool = [
    { category: 'cities' as const, difficulty: 'easy' as const, size: 3 },
    { category: 'capital' as const, difficulty: 'easy' as const, size: 2 },
  ];

  it('maps a position over the groups to the n-th place of its group', () => {
    expect(slotAt(pool, 0)).toEqual({ category: 'cities', difficulty: 'easy', n: 1 });
    expect(slotAt(pool, 2)).toEqual({ category: 'cities', difficulty: 'easy', n: 3 });
    expect(slotAt(pool, 3)).toEqual({ category: 'capital', difficulty: 'easy', n: 1 });
    expect(slotAt(pool, 4)).toEqual({ category: 'capital', difficulty: 'easy', n: 2 });
  });

  it('throws for a position outside the pool', () => {
    expect(() => slotAt(pool, 5)).toThrow('outside the pool');
  });
});

describe('cluesCategory', () => {
  it('derives the Clues category from the Compass one: capital, citiesFr, otherwise cities', () => {
    expect(cluesCategory(place('capital'))).toBe('capital');
    expect(cluesCategory(place('citiesFr'))).toBe('citiesFr');
    expect(cluesCategory(place('cities'))).toBe('cities');
    expect(cluesCategory(place('landmarks'))).toBe('cities');
    expect(cluesCategory(place(null))).toBe('cities');
  });
});

describe('Clues numbering', () => {
  const clue = (category: Category | null, difficulty: Difficulty = 'easy', n?: number): PlaceDoc => ({
    ...place(category, difficulty),
    clues: {
      positionInCountry: 'n',
      population: 1,
      climateEmoji: '',
      elevationMeters: 1,
      timezone: 'Europe/Paris',
      airportCode: 'AAA',
      emojis: ['a', 'b', 'c'],
      ...(n !== undefined && { n }),
    },
  });

  it('numbers the Clues places by derived category x difficulty, leaving the others out', () => {
    const { numbers, counts } = computeNumbering(
      [
        ['a', clue('capital')],
        ['b', clue('landmarks')],
        ['c', clue(null)],
        ['d', place('cities')],
      ],
      { numbering: CLUES_NUMBERING },
    );

    expect(Object.keys(numbers).sort()).toEqual(['a', 'b', 'c']);
    expect([numbers.b, numbers.c].sort()).toEqual([1, 2]);
    expect(counts).toEqual({ capital: { easy: 1 }, cities: { easy: 2 } });
  });

  it('keeps the Clues numbers dense when a place changes group', () => {
    const places = { a: clue('cities', 'easy', 1), b: clue('cities', 'easy', 2), c: clue('cities', 'easy', 3) };
    const plan = planRegroup(
      places,
      { cities: { easy: 3 } },
      'a',
      { ...places.a, difficulty: 'hard' },
      CLUES_NUMBERING,
    );

    expect(plan).toEqual({ n: 1, moved: { c: 1 }, counts: { cities: { easy: 2, hard: 1 } } });
  });
});
