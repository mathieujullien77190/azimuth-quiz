import type { Category, ClueCategory, Difficulty } from '@/types';

import type { CompassCounts, ContourCounts, PlaceDoc } from './types';

/**
 * Places are numbered inside their group, 1..size, dense — twice: Compass places by (`compass.category` x
 * `difficulty`, stored in `PlaceDoc.n`) and Clues places by (`clues.category` x `difficulty`, stored in
 * `clues.n`). The game reads the group sizes (`meta/compassCounts`, `meta/cluesCounts`), draws random
 * positions over the selected groups and asks Firestore for `n in [...]` — see
 * `games/compass/helpers/firestorePlaces.ts`. Everything here is pure: the seed, the admin (numbering
 * screens, edits) and the game share it. The two numberings differ only by the `Numbering` they use.
 */

export type Group = { category: Category; difficulty: Difficulty };

/** How a numbering finds a place's group and its number: what tells Compass and Clues apart. */
export type Numbering = {
  groupOf: (place: PlaceDoc | null | undefined) => Group | null;
  numberOf: (place: PlaceDoc) => number | undefined;
};

/** The Clues category of a place, derived from its Compass category: a capital, a French city, or any
 * other (foreign) city — the same three-way split `placeCategory` makes in the game. */
export const cluesCategory = (place: Pick<PlaceDoc, 'compass'>): ClueCategory =>
  place.compass?.category === 'capital' || place.compass?.category === 'citiesFr' ? place.compass.category : 'cities';

export const COMPASS_NUMBERING: Numbering = {
  groupOf: (place) => (place?.compass ? { category: place.compass.category, difficulty: place.difficulty } : null),
  numberOf: (place) => place.n,
};

export const CLUES_NUMBERING: Numbering = {
  groupOf: (place) => (place?.clues ? { category: cluesCategory(place), difficulty: place.difficulty } : null),
  numberOf: (place) => place.clues?.n,
};

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

/** Numbers every place of `entries` that `numbering` puts in a group, 1..size, in the shuffled order of
 * `shuffleRank`. */
export const computeNumbering = (
  entries: [string, PlaceDoc][],
  { numbering = COMPASS_NUMBERING }: { numbering?: Numbering } = {},
): { numbers: Record<string, number>; counts: CompassCounts } => {
  const groups = new Map<string, { group: Group; keys: [string, PlaceDoc][] }>();
  for (const entry of entries) {
    const group = numbering.groupOf(entry[1]);
    if (!group) continue;
    const id = groupId(group);
    if (!groups.has(id)) groups.set(id, { group, keys: [] });
    groups.get(id)!.keys.push(entry);
  }
  const numbers: Record<string, number> = {};
  let counts: CompassCounts = {};
  for (const { group, keys } of groups.values()) {
    [...keys].sort(([a], [b]) => shuffleRank(a) - shuffleRank(b)).forEach(([key], index) => (numbers[key] = index + 1));
    counts = withSize(counts, group, keys.length);
  }
  return { numbers, counts };
};

export type Regroup = {
  /** The changed place's own number (`null` when it has no group any more / never had one). */
  n: number | null;
  /** Other places whose number changes: the last one of the group the place left takes its freed number. */
  moved: Record<string, number>;
  counts: CompassCounts;
};

/**
 * Keeps the numbering dense when `places[key]` becomes `next` (`null` = deleted): the place leaves its old
 * group (the last-numbered place of that group takes the freed number, the group shrinks by one) and joins
 * its new one at the end (`size + 1`). Nothing moves when the group is the same.
 */
export const planRegroup = (
  places: Record<string, PlaceDoc>,
  counts: CompassCounts,
  key: string,
  next: PlaceDoc | null,
  numbering: Numbering = COMPASS_NUMBERING,
): Regroup => {
  const previous = places[key];
  const from = numbering.groupOf(previous);
  const to = numbering.groupOf(next);
  if (from && to && groupId(from) === groupId(to))
    return { n: numbering.numberOf(previous) ?? null, moved: {}, counts };

  const moved: Record<string, number> = {};
  let nextCounts = counts;
  if (from) {
    const size = sizeOf(counts, from);
    if (numbering.numberOf(previous) !== size) {
      const last = Object.entries(places).find(
        ([otherKey, other]) =>
          otherKey !== key &&
          numbering.numberOf(other) === size &&
          numbering.groupOf(other) &&
          groupId(numbering.groupOf(other)!) === groupId(from),
      );
      if (last) moved[last[0]] = numbering.numberOf(previous)!;
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

export type ContourRegroup = {
  /** The country's own number in its new group. */
  n: number;
  /** The other country whose number changes: the last one of the group the country left takes its freed number. */
  moved: Record<string, number>;
  counts: ContourCounts;
};

/**
 * Silhouette's numbering (`countries/{code}.n`, one group per difficulty) kept dense when a country changes difficulty:
 * it leaves its old group (the last-numbered country of that group takes the freed number, the group shrinks by one) and
 * joins the new one at the end (`size + 1`). Same idea as `planRegroup`, for a numbering with a single level.
 */
export const planContourDifficultyChange = (
  countries: Record<string, { difficulty?: Difficulty; n?: number }>,
  counts: ContourCounts,
  code: string,
  difficulty: Difficulty,
): ContourRegroup => {
  const previous = countries[code];
  const from = previous?.difficulty;
  if (from === difficulty) return { n: previous.n ?? 0, moved: {}, counts };

  const next: ContourCounts = { ...counts };
  const moved: Record<string, number> = {};
  if (from !== undefined) {
    const size = counts[from] ?? 0;
    if (previous.n !== undefined && previous.n !== size) {
      const last = Object.entries(countries).find(
        ([otherCode, other]) => otherCode !== code && other.difficulty === from && other.n === size,
      );
      if (last) moved[last[0]] = previous.n;
    }
    if (size > 1) next[from] = size - 1;
    else delete next[from];
  }
  const n = (next[difficulty] ?? 0) + 1;
  next[difficulty] = n;
  return { n, moved, counts: next };
};
