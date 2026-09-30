import type { Category, Difficulty } from '@/types';

import type { CompassCounts, PlaceDoc } from './types';

/**
 * Compass places are numbered inside their group (`compass.category` x `difficulty`): 1..size, dense.
 * The game reads the group sizes (`meta/compassCounts`), draws random positions over the selected
 * groups and asks Firestore for `n in [...]` — see `games/compass/helpers/firestorePlaces.ts`.
 * Everything here is pure: the seed, the admin (numbering screen, edits) and the game share it.
 */

export type Group = { category: Category; difficulty: Difficulty };

const groupOf = (place: PlaceDoc | null | undefined): Group | null =>
  place?.compass ? { category: place.compass.category, difficulty: place.difficulty } : null;

const groupId = ({ category, difficulty }: Group): string => `${category}|${difficulty}`;

const sizeOf = (counts: CompassCounts, { category, difficulty }: Group): number => counts[category]?.[difficulty] ?? 0;

const withSize = (counts: CompassCounts, { category, difficulty }: Group, size: number): CompassCounts => {
  const next: CompassCounts = { ...counts, [category]: { ...counts[category] } };
  if (size > 0) next[category]![difficulty] = size;
  else delete next[category]![difficulty];
  if (Object.keys(next[category]!).length === 0) delete next[category];
  return next;
};

/** A stable pseudo-random rank for a place key (FNV-1a + murmur3 finalizer): always the same for a key,
 * spread evenly. Numbering a group in this order shuffles it once for all, so consecutive `n` — what the
 * game's per-group cursor takes — look random instead of following the import order. */
export const shuffleRank = (key: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 2 ** 32;
};

/** Numbers every Compass place of `entries`: a group that already is exactly 1..size keeps its `n`, any other
 * group (or every group when `force` is set) is renumbered 1..size in the shuffled order of `shuffleRank`. */
export const computeNumbering = (
  entries: [string, PlaceDoc][],
  { force = false }: { force?: boolean } = {},
): { numbers: Record<string, number>; counts: CompassCounts } => {
  const groups = new Map<string, { group: Group; keys: [string, PlaceDoc][] }>();
  for (const entry of entries) {
    const group = groupOf(entry[1]);
    if (!group) continue;
    const id = groupId(group);
    if (!groups.has(id)) groups.set(id, { group, keys: [] });
    groups.get(id)!.keys.push(entry);
  }
  const numbers: Record<string, number> = {};
  let counts: CompassCounts = {};
  for (const { group, keys } of groups.values()) {
    const existing = keys.map(([, place]) => place.n ?? 0).sort((a, b) => a - b);
    const keep = !force && existing.every((n, index) => n === index + 1);
    const shuffled = [...keys].sort(([a], [b]) => shuffleRank(a) - shuffleRank(b));
    if (keep) keys.forEach(([key, place]) => (numbers[key] = place.n!));
    else shuffled.forEach(([key], index) => (numbers[key] = index + 1));
    counts = withSize(counts, group, keys.length);
  }
  return { numbers, counts };
};

/** True when every Compass place has an `n` and `counts` is exactly the numbering of `places`. */
export const isNumberingConsistent = (places: Record<string, PlaceDoc>, counts: CompassCounts | undefined): boolean => {
  const { numbers, counts: expected } = computeNumbering(Object.entries(places));
  const numbered = Object.entries(places).every(([key, place]) => !place.compass || place.n === numbers[key]);
  return numbered && JSON.stringify(sortedCounts(expected)) === JSON.stringify(sortedCounts(counts ?? {}));
};

const sortedCounts = (counts: CompassCounts): [string, [string, number][]][] =>
  Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, byDifficulty]) => [
      category,
      Object.entries(byDifficulty!).sort(([a], [b]) => a.localeCompare(b)) as [string, number][],
    ]);

export type Regroup = {
  /** The changed place's own `n` (`null` when it has no Compass group any more / never had one). */
  n: number | null;
  /** Other places whose `n` changes: the last one of the group the place left takes its freed number. */
  moved: Record<string, number>;
  counts: CompassCounts;
};

/**
 * Keeps the numbering dense when `places[key]` becomes `next` (`null` = deleted): the place leaves its old
 * group (the last-numbered place of that group takes the freed `n`, the group shrinks by one) and joins
 * its new one at the end (`size + 1`). Nothing moves when the group is the same.
 */
export const planRegroup = (
  places: Record<string, PlaceDoc>,
  counts: CompassCounts,
  key: string,
  next: PlaceDoc | null,
): Regroup => {
  const previous = places[key];
  const from = groupOf(previous);
  const to = groupOf(next);
  if (from && to && groupId(from) === groupId(to)) return { n: previous.n ?? null, moved: {}, counts };

  const moved: Record<string, number> = {};
  let nextCounts = counts;
  if (from) {
    const size = sizeOf(counts, from);
    if (previous.n !== size) {
      const last = Object.entries(places).find(
        ([otherKey, other]) =>
          otherKey !== key && other.n === size && groupOf(other) && groupId(groupOf(other)!) === groupId(from),
      );
      if (last) moved[last[0]] = previous.n!;
    }
    nextCounts = withSize(nextCounts, from, size - 1);
  }
  let n: number | null = null;
  if (to) {
    n = sizeOf(nextCounts, to) + 1;
    nextCounts = withSize(nextCounts, to, n);
  }
  return { n, moved, counts: nextCounts };
};

/** A random draw target: the `n`-th place of a group. */
export type Slot = Group & { n: number };

/** Maps `position` (0-based) over the concatenation of `pool`'s groups to the group and `n` it falls in. */
export const slotAt = (pool: (Group & { size: number })[], position: number): Slot => {
  let offset = position;
  for (const { size, ...group } of pool) {
    if (offset < size) return { ...group, n: offset + 1 };
    offset -= size;
  }
  throw new Error(`Position ${position} is outside the pool`);
};
