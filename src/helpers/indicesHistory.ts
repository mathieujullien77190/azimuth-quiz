import AsyncStorage from '@react-native-async-storage/async-storage';

import { INDICES_HISTORY_STORAGE_KEY } from '@/constants';
import type { IndicesPlace } from '@/types';

/** How many times each place has been drawn, keyed by `indicesPlaceKey`. */
export type IndicesDrawHistory = Record<string, number>;

export const indicesPlaceKey = (place: Pick<IndicesPlace, 'name' | 'code'>): string => `${place.code}|${place.name}`;

// In-memory cache so a screen can read the history synchronously once it's loaded, and so
// repeated calls don't hit AsyncStorage again mid-session. `loading` dedupes concurrent callers
// onto the same read instead of each firing their own.
let cached: IndicesDrawHistory | null = null;
let loading: Promise<IndicesDrawHistory> | null = null;

/** Whatever's loaded so far, or `null` before the first `loadIndicesHistory()` resolves — for a
 * caller that needs the history synchronously (drawing a place can't await mid-render) and would
 * rather fall back to "nothing drawn yet" than block. */
export const getCachedIndicesHistory = (): IndicesDrawHistory | null => cached;

/** Loads (or returns the cached) draw history. Call this early (e.g. when the setup screen
 * mounts) so it's already cached by the time a round actually needs it. */
export const loadIndicesHistory = (): Promise<IndicesDrawHistory> => {
  if (cached) return Promise.resolve(cached);
  loading ??= AsyncStorage.getItem(INDICES_HISTORY_STORAGE_KEY)
    .then((raw) => (raw ? (JSON.parse(raw) as IndicesDrawHistory) : {}))
    .catch(() => ({}))
    .then((result) => {
      cached = result;
      return result;
    });
  return loading;
};

/** Records one more draw of `place`, in memory immediately and to storage in the background —
 * callers don't need to await this, it's not critical if it doesn't make it to disk. */
export const recordIndicesDraw = (place: Pick<IndicesPlace, 'name' | 'code'>): void => {
  const key = indicesPlaceKey(place);
  const base = cached ?? {};
  const updated = { ...base, [key]: (base[key] ?? 0) + 1 };
  cached = updated;
  AsyncStorage.setItem(INDICES_HISTORY_STORAGE_KEY, JSON.stringify(updated)).catch(() => {
    // Not saved: repeats just won't be avoided as well next session, not critical.
  });
};

/** Picks among `pool` preferring places drawn the fewest times (per `history`) — once every
 * place in the pool has been drawn at least once, this naturally starts cycling through the
 * ones drawn least, rather than repeating at random. */
export const pickLeastDrawn = (pool: IndicesPlace[], history: IndicesDrawHistory): IndicesPlace => {
  const drawCount = (place: IndicesPlace) => history[indicesPlaceKey(place)] ?? 0;
  const minCount = Math.min(...pool.map(drawCount));
  const candidates = pool.filter((place) => drawCount(place) === minCount);
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/** Clears the draw history (bundled with the app's "clear data" action). */
export const clearIndicesHistory = (): void => {
  cached = {};
  loading = null;
  AsyncStorage.removeItem(INDICES_HISTORY_STORAGE_KEY).catch(() => {
    // Not critical: at worst the old history sticks around.
  });
};
