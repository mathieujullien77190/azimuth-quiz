import { shuffle } from './random';

/**
 * Repartit `total` elements sur des seaux au plus egalement, sans depasser leur capacite : un a la fois,
 * dans un ordre aleatoire (5 sur 6 = 1-1-1-1-1-0). Un seau plein sort. Rend moins que `total` si tout est plein.
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
