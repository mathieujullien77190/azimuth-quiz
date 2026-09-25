import { CONTOURS, decodeContours } from './codec';

describe('decodeContours', () => {
  it('merges each code with its own points and curated neighbor list', () => {
    const decoded = decodeContours({ FR: [[0, 0], [1, 1]] });
    expect(decoded).toHaveLength(1);
    expect(decoded[0].code).toBe('FR');
    expect(decoded[0].points).toEqual([[0, 0], [1, 1]]);
    expect(decoded[0].neighbors.length).toBeGreaterThan(0);
  });

  it('falls back to an empty neighbor list for a code with no curated data', () => {
    const decoded = decodeContours({ XX: [[0, 0]] });
    expect(decoded[0].neighbors).toEqual([]);
  });

  it('gives France easy and Norway hard, everyone else intermediate (including an unknown code)', () => {
    const decoded = decodeContours({ FR: [[0, 0]], NO: [[0, 0]], DE: [[0, 0]], XX: [[0, 0]] });
    expect(decoded.find((c) => c.code === 'FR')?.difficulty).toBe('easy');
    expect(decoded.find((c) => c.code === 'NO')?.difficulty).toBe('hard');
    expect(decoded.find((c) => c.code === 'DE')?.difficulty).toBe('intermediate');
    expect(decoded.find((c) => c.code === 'XX')?.difficulty).toBe('intermediate');
  });
});

describe('CONTOURS', () => {
  it('gives every one of the 8 Contour countries at least one neighbor', () => {
    for (const country of CONTOURS) {
      expect(country.neighbors.length).toBeGreaterThan(0);
    }
  });

  it('gives France easy, Norway hard, and every other country intermediate', () => {
    const difficultyOf = (code: string) => CONTOURS.find((c) => c.code === code)?.difficulty;
    expect(difficultyOf('FR')).toBe('easy');
    expect(difficultyOf('NO')).toBe('hard');
    for (const code of ['ES', 'IT', 'PT', 'DE', 'IE', 'GR']) {
      expect(difficultyOf(code)).toBe('intermediate');
    }
  });

  it('gives every country neighbor a valid ISO code and every sea neighbor an fr/en name', () => {
    for (const country of CONTOURS) {
      for (const neighbor of country.neighbors) {
        expect(neighbor.x).toBeGreaterThanOrEqual(0);
        expect(neighbor.x).toBeLessThanOrEqual(1);
        expect(neighbor.y).toBeGreaterThanOrEqual(0);
        expect(neighbor.y).toBeLessThanOrEqual(1);
        if (neighbor.type === 'country') {
          expect(neighbor.code).toMatch(/^[A-Z]{2}$/);
        } else {
          expect(neighbor.fr.length).toBeGreaterThan(0);
          expect(neighbor.en.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
