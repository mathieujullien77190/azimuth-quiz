import { bearingToCardinal, normalizeBearing } from './geo';

const NARROW_NBSP = ' ';

export const formatNumber = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP);

export const formatDistance = (km: number): string => `${formatNumber(km)}${NARROW_NBSP}km`;

export const formatBearing = (degrees: number, cardinals: readonly string[]): string =>
  `${bearingToCardinal(degrees, cardinals)} · ${Math.round(normalizeBearing(degrees)) % 360}°`;

/** Initiales d'un joueur : les 2 premieres lettres de son nom, en majuscules. */
export const initials = (name: string): string => name.trim().slice(0, 2).toUpperCase();

/** Melange de Fisher-Yates, sans modifier `items`. */
export const shuffle = <T>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

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
