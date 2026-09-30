import { shuffle } from '@/helpers/random';

/**
 * Splits `total` items over buckets as evenly as possible, no bucket getting more than its capacity:
 * one item at a time to each open bucket in turn, in a random order, so 5 items over 6 buckets is
 * 1-1-1-1-1-0 (which one gets nothing is random) and 5 over 2 is 3-2 or 2-3. A bucket that is full
 * drops out and the others share what is left. Gives fewer than `total` only when all the buckets
 * together cannot hold it.
 */
export const splitEvenly = (total: number, capacities: readonly number[]): number[] => {
  const counts = capacities.map(() => 0);
  let left = total;
  for (;;) {
    const open = shuffle(capacities.map((_, index) => index).filter((index) => counts[index] < capacities[index]));
    if (left <= 0 || open.length === 0) return counts;
    for (const index of open.slice(0, left)) counts[index] += 1;
    left -= Math.min(left, open.length);
  }
};
