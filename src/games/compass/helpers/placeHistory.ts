import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Slot } from '@/data/firestore/numbering';
import { COMPASS_HISTORY_STORAGE_KEY } from '@/games/compass/constants';

/** The numbers (`PlaceDoc.n`) already played on this device, per group: `"cities|easy" -> [17, 42]`.
 * Lets the next draw prefer places never seen here (see `fetchRandomPlaces`). AsyncStorage is
 * localStorage on the web, so it is the same code on every platform. */
export type CompassHistory = Record<string, number[]>;

export const groupKey = ({ category, difficulty }: Pick<Slot, 'category' | 'difficulty'>): string => `${category}|${difficulty}`;

// Same caching as `clueHistory.ts`: readable synchronously once loaded, and concurrent callers share
// one read. A failed read or write only means repeats are avoided less well, never an error.
let cached: CompassHistory | null = null;
let loading: Promise<CompassHistory> | null = null;

export const loadCompassHistory = (): Promise<CompassHistory> => {
  if (cached) return Promise.resolve(cached);
  loading ??= AsyncStorage.getItem(COMPASS_HISTORY_STORAGE_KEY)
    .then((raw) => (raw ? (JSON.parse(raw) as CompassHistory) : {}))
    .catch(() => ({}))
    .then((result) => {
      cached = result;
      return result;
    });
  return loading;
};

export const hasPlayed = (history: CompassHistory, slot: Slot): boolean => history[groupKey(slot)]?.includes(slot.n) ?? false;

const store = (history: CompassHistory): void => {
  cached = history;
  AsyncStorage.setItem(COMPASS_HISTORY_STORAGE_KEY, JSON.stringify(history)).catch(() => {
    // Not saved: repeats just won't be avoided as well next session, not critical.
  });
};

/** Remembers the places just drawn for a game. */
export const recordCompassPlays = (slots: Slot[]): void => {
  const next: CompassHistory = { ...(cached ?? {}) };
  for (const slot of slots) {
    const key = groupKey(slot);
    next[key] = [...new Set([...(next[key] ?? []), slot.n])];
  }
  store(next);
};

/** Forgets the given groups: once every place of a pool has been seen, the cycle starts over. */
export const forgetCompassGroups = (keys: string[]): void => {
  const next: CompassHistory = { ...(cached ?? {}) };
  for (const key of keys) delete next[key];
  store(next);
};

/** Clears the history (bundled with the app's "clear data" action). */
export const clearCompassHistory = (): void => {
  store({});
};
