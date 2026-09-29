import type { Difficulty } from '@/types';

import { CONTOURS, decodeContours } from './codec';

describe('decodeContours', () => {
  it('merges a country row into a resolved ContourCountry', () => {
    const decoded = decodeContours({
      FR: {
        points: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
        neighbors: [{ type: 'country', code: 'DE', x: 0.1, y: 0.2 }],
      },
    });
    expect(decoded).toHaveLength(1);
    expect(decoded[0].code).toBe('FR');
    expect(decoded[0].points).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
    expect(decoded[0].neighbors).toEqual([{ type: 'country', code: 'DE', x: 0.1, y: 0.2 }]);
  });

  it('is empty when no country has a row (the vast majority of countries)', () => {
    expect(decodeContours({})).toEqual([]);
  });

  it('falls back to an empty neighbor list, the default center label and intermediate difficulty when the row omits them', () => {
    const decoded = decodeContours({
      XX: {
        points: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
      },
    });
    expect(decoded[0].neighbors).toEqual([]);
    expect(decoded[0].centerLabel).toEqual({ x: 0.5, y: 0.5 });
    expect(decoded[0].difficulty).toBe('intermediate');
  });

  it('keeps an explicit centerLabel/difficulty instead of the default', () => {
    const decoded = decodeContours({
      NO: {
        points: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
        centerLabel: { x: 0.3, y: 0.7 },
        difficulty: 'hard',
      },
    });
    expect(decoded[0].centerLabel).toEqual({ x: 0.3, y: 0.7 });
    expect(decoded[0].difficulty).toBe('hard');
  });
});

describe('CONTOURS', () => {
  it('gives every country an outline of at least 3 points', () => {
    for (const country of CONTOURS) {
      expect(country.points.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('allows a country with no neighbors at all (expected for an island with no land border)', () => {
    for (const country of CONTOURS) {
      expect(Array.isArray(country.neighbors)).toBe(true);
    }
  });

  it('gives every country a valid Difficulty, pins France/Spain easy and Norway hard, and every other country intermediate', () => {
    const validDifficulties: Difficulty[] = ['easy', 'intermediate', 'hard'];
    const difficultyOf = (code: string) => CONTOURS.find((c) => c.code === code)?.difficulty;

    for (const country of CONTOURS) {
      expect(validDifficulties).toContain(country.difficulty);
    }

    expect(difficultyOf('FR')).toBe('easy');
    expect(difficultyOf('ES')).toBe('easy');
    expect(difficultyOf('NO')).toBe('hard');

    for (const country of CONTOURS) {
      if (['FR', 'ES', 'NO'].includes(country.code)) continue;
      expect(country.difficulty).toBe('intermediate');
    }
  });

  it('gives every neighbor a valid ISO code and an on-board position', () => {
    for (const country of CONTOURS) {
      for (const neighbor of country.neighbors) {
        expect(neighbor.x).toBeGreaterThanOrEqual(0);
        expect(neighbor.x).toBeLessThanOrEqual(1);
        expect(neighbor.y).toBeGreaterThanOrEqual(0);
        expect(neighbor.y).toBeLessThanOrEqual(1);
        expect(neighbor.code).toMatch(/^[A-Z]{2}$/);
      }
    }
  });
});
