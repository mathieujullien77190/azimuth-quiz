import { formatBearing, formatDistance, formatNumber, initials, splitEvenly } from '../utils';

describe('formatNumber', () => {
  it('rounds to the nearest integer', () => {
    expect(formatNumber(3.4)).toBe('3');
    expect(formatNumber(3.6)).toBe('4');
  });

  it('inserts a narrow no-break space every 3 digits', () => {
    expect(formatNumber(1234)).toBe('1 234');
    expect(formatNumber(1234567)).toBe('1 234 567');
  });

  it('leaves small numbers untouched', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatDistance', () => {
  it('appends km with a narrow no-break space', () => {
    expect(formatDistance(1234)).toBe('1 234 km');
  });
});

describe('formatBearing', () => {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;

  it('combines the cardinal point and the rounded degrees', () => {
    expect(formatBearing(0, cardinals)).toBe('N · 0°');
    expect(formatBearing(90, cardinals)).toBe('E · 90°');
  });

  it('normalizes negative or out-of-range degrees', () => {
    // -10 se normalise en 350°, plus proche de N (360=0) que de NO (315).
    expect(formatBearing(-10, cardinals)).toBe('N · 350°');
    expect(formatBearing(370, cardinals)).toBe('N · 10°');
  });
});

describe('initials', () => {
  it('takes the first 2 letters, uppercased', () => {
    expect(initials('mathieu')).toBe('MA');
  });

  it('trims surrounding whitespace first', () => {
    expect(initials('  zoe  ')).toBe('ZO');
  });

  it('handles names shorter than 2 letters', () => {
    expect(initials('a')).toBe('A');
    expect(initials('')).toBe('');
  });
});

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

describe('splitEvenly', () => {
  it('gives one item to some buckets and none to the others when there are more buckets than items', () => {
    for (let run = 0; run < 50; run += 1) {
      const counts = splitEvenly(5, [10, 10, 10, 10, 10, 10]);
      expect(sum(counts)).toBe(5);
      expect(counts.filter((count) => count === 1)).toHaveLength(5);
      expect(counts.filter((count) => count === 0)).toHaveLength(1);
    }
  });

  it('does not always leave the same bucket out', () => {
    const left = new Set<number>();
    for (let run = 0; run < 200; run += 1) left.add(splitEvenly(5, [9, 9, 9, 9, 9, 9]).indexOf(0));
    expect(left.size).toBeGreaterThan(3);
  });

  it('shares as evenly as possible: the parts differ by at most one', () => {
    for (let total = 0; total <= 20; total += 1) {
      const counts = splitEvenly(total, [50, 50, 50]);
      expect(sum(counts)).toBe(total);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(total === 0 ? 0 : 1);
    }
  });

  it('gives the extra item to a random bucket', () => {
    const winners = new Set<number>();
    for (let run = 0; run < 100; run += 1) winners.add(splitEvenly(5, [9, 9]).indexOf(3));
    expect(winners).toEqual(new Set([0, 1]));
  });

  it('never goes over a bucket capacity: a small bucket is filled and the others take the rest', () => {
    expect(splitEvenly(10, [2, 50, 50]).sort((a, b) => a - b)).toEqual([2, 4, 4]);
    expect(splitEvenly(9, [1, 1, 50])).toEqual([1, 1, 7]);
  });

  it('gives fewer than asked only when all the buckets together are too small', () => {
    expect(splitEvenly(10, [2, 3])).toEqual([2, 3]);
  });

  it('handles no bucket and nothing to split', () => {
    expect(splitEvenly(4, [])).toEqual([]);
    expect(splitEvenly(0, [5, 5])).toEqual([0, 0]);
  });
});
