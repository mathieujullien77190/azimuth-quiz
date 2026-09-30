import { FIXTURE_CONTOURS as CONTOURS } from '@/helpers/storyFixtures';

import {
  FULL_PRECISION,
  levelVertexCounts,
  mulberry32,
  newSimplifySeed,
  PRECISION_LEVELS,
  roundSimplifySeed,
  simplificationLevels,
} from './simplify';

const ring = (code: string) => CONTOURS.find((country) => country.code === code)!.points;

/** A closed regular polygon with `n` distinct vertices. */
const polygon = (n: number): [number, number][] => {
  const points: [number, number][] = Array.from({ length: n }, (_, i) => [
    Math.cos((2 * Math.PI * i) / n),
    Math.sin((2 * Math.PI * i) / n),
  ]);
  return [...points, points[0]];
};

describe('mulberry32', () => {
  it('gives the same sequence for the same seed, in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const values = Array.from({ length: 5 }, () => a());
    expect(values).toEqual(Array.from({ length: 5 }, () => b()));
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
    expect(mulberry32(43)()).not.toBe(values[0]);
  });
});

describe('seeds', () => {
  it('newSimplifySeed is a 32-bit unsigned integer', () => {
    const seed = newSimplifySeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2 ** 32);
  });

  it('roundSimplifySeed is a pure function of room seed, round and country', () => {
    expect(roundSimplifySeed(5, 0, 'FR')).toBe(roundSimplifySeed(5, 0, 'FR'));
    const others = [roundSimplifySeed(6, 0, 'FR'), roundSimplifySeed(5, 1, 'FR'), roundSimplifySeed(5, 0, 'ES')];
    for (const other of others) expect(other).not.toBe(roundSimplifySeed(5, 0, 'FR'));
    expect(Number.isInteger(roundSimplifySeed(5, 0, 'FR'))).toBe(true);
  });
});

describe('levelVertexCounts', () => {
  it('grows the levels much slower than the ring: a few vertices for a small country, a few dozen for a huge one', () => {
    expect(levelVertexCounts(29)).toEqual([6, 10, 16, 29]);
    expect(levelVertexCounts(100)).toEqual([8, 15, 27, 100]);
    expect(levelVertexCounts(245)).toEqual([10, 20, 39, 245]);
  });

  it('still adds a few vertices at every level for a small ring', () => {
    expect(levelVertexCounts(19)).toEqual([5, 9, 13, 19]);
    expect(levelVertexCounts(12)).toEqual([5, 8, 11, 12]);
  });

  it('never decreases and never exceeds the ring, whatever its size', () => {
    for (let n = 0; n < 400; n += 1) {
      const counts = levelVertexCounts(n);
      expect(counts).toHaveLength(PRECISION_LEVELS);
      expect(counts[3]).toBe(n);
      for (let level = 1; level < counts.length; level += 1) {
        expect(counts[level]).toBeGreaterThanOrEqual(counts[level - 1]);
      }
    }
  });

  it('keeps the whole ring on every level when it has 3 vertices or fewer', () => {
    expect(levelVertexCounts(3)).toEqual([3, 3, 3, 3]);
    expect(levelVertexCounts(2)).toEqual([2, 2, 2, 2]);
  });

  it('never draws fewer than 4 vertices on the coarse level, and keeps the ring when it has fewer', () => {
    expect(levelVertexCounts(7)).toEqual([4, 7, 7, 7]);
    expect(levelVertexCounts(4)).toEqual([4, 4, 4, 4]);
  });
});

describe('simplificationLevels', () => {
  const france = ring('FR');

  it('gives four closed rings, the last being the very same array as the input', () => {
    const levels = simplificationLevels(france, 1);
    expect(levels).toHaveLength(PRECISION_LEVELS);
    expect(levels[FULL_PRECISION]).toBe(france);
    for (const level of levels) {
      expect(level.length).toBeGreaterThanOrEqual(4);
      expect(level[0]).toEqual(level[level.length - 1]);
      expect(level[0]).toEqual(france[0]);
    }
  });

  it('has the announced sizes, +1 for the closing point', () => {
    const levels = simplificationLevels(france, 1);
    expect(levels.map((level) => level.length - 1)).toEqual(levelVertexCounts(france.length - 1));
  });

  it('is deterministic for a seed and varies with it', () => {
    expect(simplificationLevels(france, 3)).toEqual(simplificationLevels(france, 3));
    const variants = new Set([1, 2, 3, 4, 5, 6].map((seed) => JSON.stringify(simplificationLevels(france, seed)[0])));
    expect(variants.size).toBeGreaterThan(1);
  });

  it('nests the levels: each one contains every vertex of the previous one, in the same order', () => {
    for (const code of ['FR', 'ES', 'BE']) {
      const levels = simplificationLevels(ring(code), 9);
      for (let level = 1; level < levels.length; level += 1) {
        const indexes = levels[level - 1].map((point) => levels[level].indexOf(point));
        expect(indexes).not.toContain(-1);
        const inner = indexes.slice(0, -1);
        expect(inner).toEqual([...inner].sort((a, b) => a - b));
      }
    }
  });

  it('only uses vertices of the ring, never invented points', () => {
    const levels = simplificationLevels(france, 2);
    for (const point of levels[0]) expect(france).toContain(point);
  });

  it('keeps the ring as it is when it is too small to simplify', () => {
    const small = polygon(4);
    const levels = simplificationLevels(small, 1);
    expect(levels.every((level) => level === small)).toBe(true);
  });

  it('simplifies a regular polygon down to the announced counts, never below a triangle', () => {
    const levels = simplificationLevels(polygon(40), 5);
    expect(levels.map((level) => level.length - 1)).toEqual([7, 11, 18, 40]);
    const tiny = simplificationLevels(polygon(12), 5);
    expect(tiny.map((level) => level.length - 1)).toEqual([5, 8, 11, 12]);
  });

  it('accepts a ring that is not closed (its last point is a vertex like any other)', () => {
    const open = polygon(30).slice(0, -1);
    const levels = simplificationLevels(open, 4);
    expect(levels[3]).toBe(open);
    expect(levels[0]).toHaveLength(6 + 1);
  });

  it('runs fast enough to be done on the fly, even for the biggest ring of the game', () => {
    const biggest = CONTOURS.reduce((a, b) => (b.points.length > a.points.length ? b : a));
    const start = Date.now();
    simplificationLevels(biggest.points, 1);
    expect(Date.now() - start).toBeLessThan(500);
  });
});
