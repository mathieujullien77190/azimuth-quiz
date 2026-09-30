import AsyncStorage from '@react-native-async-storage/async-storage';

/** Where this device is in every group of a game: `"cities|easy" -> 17` = the next place to take is the 18th
 * (position 17, 0-based) of that group. Each game takes the next places from there and moves the cursor on,
 * wrapping at the end, so a group is gone through completely before any place comes back. AsyncStorage is
 * localStorage on the web, so it is the same code on every platform. */
export type GroupCursors = Record<string, number>;

/**
 * One cursor store per game (Compass, Clues, ...), kept under its own storage key. Readable once loaded
 * (concurrent callers share one read); a failed read or write only means the next game starts from a random
 * place again, never an error.
 */
export const createGroupCursors = (storageKey: string) => {
  let cached: GroupCursors | null = null;
  let loading: Promise<GroupCursors> | null = null;

  const store = (cursors: GroupCursors): void => {
    cached = cursors;
    AsyncStorage.setItem(storageKey, JSON.stringify(cursors)).catch(() => {
      // Not saved: the next session starts from a random place again, not critical.
    });
  };

  return {
    load: (): Promise<GroupCursors> => {
      if (cached) return Promise.resolve(cached);
      loading ??= AsyncStorage.getItem(storageKey)
        .then((raw) => (raw ? (JSON.parse(raw) as GroupCursors) : {}))
        .catch(() => ({}))
        .then((result) => {
          cached = result;
          return result;
        });
      return loading;
    },
    /** Moves the given groups' cursors on (the others keep theirs). */
    save: (moved: GroupCursors): void => store({ ...(cached ?? {}), ...moved }),
    /** Clears the cursors (bundled with the app's "clear data" action). */
    clear: (): void => store({}),
  };
};
