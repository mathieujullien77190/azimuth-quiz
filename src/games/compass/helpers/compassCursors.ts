import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Slot } from '@/data/firestore/numbering';
import { COMPASS_CURSORS_STORAGE_KEY } from '@/games/compass/constants';

/** Where this device is in every Compass group: `"cities|easy" -> 17` = the next place to take is the 18th
 * (position 17, 0-based) of that group. Each game takes the next places from there and moves the cursor on,
 * wrapping at the end, so a group is gone through completely before any place comes back. AsyncStorage is
 * localStorage on the web, so it is the same code on every platform. */
export type CompassCursors = Record<string, number>;

export const groupKey = ({ category, difficulty }: Pick<Slot, 'category' | 'difficulty'>): string =>
  `${category}|${difficulty}`;

// Same caching as `clueHistory.ts`: readable once loaded, and concurrent callers share one read. A failed
// read or write only means the next game starts from a random place again, never an error.
let cached: CompassCursors | null = null;
let loading: Promise<CompassCursors> | null = null;

export const loadCompassCursors = (): Promise<CompassCursors> => {
  if (cached) return Promise.resolve(cached);
  loading ??= AsyncStorage.getItem(COMPASS_CURSORS_STORAGE_KEY)
    .then((raw) => (raw ? (JSON.parse(raw) as CompassCursors) : {}))
    .catch(() => ({}))
    .then((result) => {
      cached = result;
      return result;
    });
  return loading;
};

const store = (cursors: CompassCursors): void => {
  cached = cursors;
  AsyncStorage.setItem(COMPASS_CURSORS_STORAGE_KEY, JSON.stringify(cursors)).catch(() => {
    // Not saved: the next session starts from a random place again, not critical.
  });
};

/** Moves the given groups' cursors on (the others keep theirs). */
export const saveCompassCursors = (moved: CompassCursors): void => {
  store({ ...(cached ?? {}), ...moved });
};

/** Clears the cursors (bundled with the app's "clear data" action). */
export const clearCompassCursors = (): void => {
  store({});
};
