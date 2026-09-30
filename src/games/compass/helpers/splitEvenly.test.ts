import { splitEvenly } from './splitEvenly';

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
