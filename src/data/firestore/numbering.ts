import type { Category, ClueCategory, Difficulty } from '@/types';

import type { CompassCounts, PlaceDoc } from './types';

/**
 * Numerotation dense 1..taille par groupe, deux fois : Boussole (`PlaceDoc.n`) et Indices (`clues.n`), ce
 * qui permet de tirer au hasard puis de demander `n in [...]`. Pur, partage par le seed, l'admin et le jeu.
 */

export type Group = { category: Category; difficulty: Difficulty };

/** Comment une numerotation trouve le groupe et le numero d'un lieu (ce qui distingue Boussole et Indices). */
export type Numbering = {
  groupOf: (place: PlaceDoc | null | undefined) => Group | null;
  numberOf: (place: PlaceDoc) => number | undefined;
};

/** Categorie Indices d'un lieu, derivee de sa categorie Boussole (meme decoupage que `placeCategory`). */
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

/** Rang pseudo-aleatoire stable d'une cle (FNV-1a + murmur3) : numeroter dans cet ordre melange le groupe une fois pour toutes. */
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

/** Numerote les lieux de `entries` qui ont un groupe, dans l'ordre de `shuffleRank`. */
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
  /** Numero du lieu modifie (`null` sans groupe). */
  n: number | null;
  /** Autres lieux renumerotes : le dernier du groupe quitte prend le numero libere. */
  moved: Record<string, number>;
  counts: CompassCounts;
};

/** Garde la numerotation dense quand `places[key]` devient `next` (`null` = supprime). Rien ne bouge si le groupe est le meme. */
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

/** Cible d'un tirage : le `n`-ieme lieu d'un groupe. */
export type Slot = Group & { n: number };

/** Place `position` (base 0) sur la concatenation des groupes de `pool` : groupe et `n`. */
export const slotAt = (pool: (Group & { size: number })[], position: number): Slot => {
  let offset = position;
  for (const { size, ...group } of pool) {
    if (offset < size) return { ...group, n: offset + 1 };
    offset -= size;
  }
  throw new Error(`Position ${position} is outside the pool`);
};
