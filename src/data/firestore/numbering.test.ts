import type { Category, Difficulty } from '@/types';

import { computeNumbering, isNumberingConsistent, planRegroup, slotAt } from './numbering';
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

describe('computeNumbering', () => {
  it('numbers each group 1..size in order and ignores non-Compass places', () => {
    const { numbers, counts } = computeNumbering([
      ['a', place('cities')],
      ['b', place(null)],
      ['c', place('cities')],
      ['d', place('cities', 'hard')],
      ['e', place('capital')],
    ]);

    expect(numbers).toEqual({ a: 1, c: 2, d: 1, e: 1 });
    expect(counts).toEqual({ cities: { easy: 2, hard: 1 }, capital: { easy: 1 } });
  });

  it('keeps a group that already is exactly 1..size, renumbers one with holes or duplicates', () => {
    const { numbers } = computeNumbering([
      ['a', place('cities', 'easy', 2)],
      ['b', place('cities', 'easy', 1)],
      ['c', place('capital', 'easy', 1)],
      ['d', place('capital', 'easy', 1)],
      ['e', place('nature', 'easy', 5)],
    ]);

    expect(numbers).toEqual({ a: 2, b: 1, c: 1, d: 2, e: 1 });
  });
});

describe('isNumberingConsistent', () => {
  const places = { a: place('cities', 'easy', 1), b: place('cities', 'easy', 2), c: place(null) };

  it('accepts a dense numbering with matching counts', () => {
    expect(isNumberingConsistent(places, { cities: { easy: 2 } })).toBe(true);
  });

  it('rejects missing counts, wrong counts and unnumbered places', () => {
    expect(isNumberingConsistent(places, undefined)).toBe(false);
    expect(isNumberingConsistent(places, { cities: { easy: 3 } })).toBe(false);
    expect(isNumberingConsistent({ ...places, b: place('cities', 'easy') }, { cities: { easy: 2 } })).toBe(false);
  });

  it('does not depend on the order the counts are written in', () => {
    const two = { a: place('cities', 'easy', 1), b: place('capital', 'hard', 1), c: place('capital', 'easy', 1) };

    expect(isNumberingConsistent(two, { capital: { hard: 1, easy: 1 }, cities: { easy: 1 } })).toBe(true);
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
    expect(planRegroup(places, counts, 'b', { ...places.b, compass: { category: 'cities', description: 'x' } })).toEqual({ n: 2, moved: {}, counts });
    expect(planRegroup(places, counts, 'a', places.a).n).toBe(1);
    expect(planRegroup({ x: place('cities', 'easy') }, { cities: { easy: 1 } }, 'x', place('cities', 'easy')).n).toBeNull();
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
    const plan = planRegroup({ a: place('cities', 'easy', 1), b: place('cities', 'easy', 2) }, { cities: { easy: 3 } }, 'a', null);

    expect(plan).toEqual({ n: null, moved: {}, counts: { cities: { easy: 2 } } });
  });

  it('drops an emptied group and a deleted place leaves without joining anything', () => {
    const plan = planRegroup(places, counts, 'd', null);

    expect(plan).toEqual({ n: null, moved: {}, counts: { cities: { easy: 3 } } });
  });

  it('ignores a place without Compass on both sides and numbers a place that just got Compass', () => {
    expect(planRegroup(places, counts, 'e', { ...places.e, difficulty: 'hard' })).toEqual({ n: null, moved: {}, counts });
    expect(planRegroup(places, counts, 'e', { ...places.e, compass: { category: 'cities' } })).toEqual({
      n: 4,
      moved: {},
      counts: { cities: { easy: 4 }, capital: { easy: 1 } },
    });
  });

  it('keeps the counts of a group that never existed out of the way', () => {
    expect(planRegroup({}, {}, 'new', place('kids', 'hard'))).toEqual({ n: 1, moved: {}, counts: { kids: { hard: 1 } } });
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
