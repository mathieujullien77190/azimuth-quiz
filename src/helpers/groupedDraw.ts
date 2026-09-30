import { and, collection, getDocs, or, query, where } from 'firebase/firestore';

import type { Group, Numbering, Slot } from '@/data/firestore/numbering';
import { COLLECTIONS, type CompassCounts, type PlaceDoc } from '@/data/firestore/types';
import type { Category, Difficulty } from '@/types';

import { db } from './firebase';
import type { GroupCursors } from './groupCursors';
import { shuffle } from './random';
import { splitEvenly } from './splitEvenly';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts`: `firebase/firestore` is
// ESM-only and crashes Jest for every test that imports the barrel for something unrelated.

/** Positions drawn per round when a tier needs filtering afterwards (English: French places are bumped a
 * tier): only some of the ones read from the tier below are kept, the rest is slack. In every other case
 * each position drawn is kept. */
const DRAW_PER_ROUND_WITH_BUMP = 3;

/** Firestore's cap on the values of one `in` filter (and of one `or` query in total). */
const IN_LIMIT = 30;

export const groupKey = ({ category, difficulty }: Pick<Group, 'category' | 'difficulty'>): string =>
  `${category}|${difficulty}`;

/** A place read from Firestore, with the group and `n` it was read at. */
type Drawn<T> = { item: T; slot: Slot };

/** How one group is gone through in a game: from its cursor (a random place the first time), one position
 * after the other, wrapping at the end of the group. */
type Walk = { key: string; group: Group; size: number; start: number; taken: number };

const remaining = (walks: Walk[]): number => walks.reduce((sum, walk) => sum + walk.size - walk.taken, 0);

/** The next place of a group: its cursor, moved on by one (wrapping at the end of the group). */
const takeFrom = (walk: Walk): Slot => {
  const n = ((walk.start + walk.taken) % walk.size) + 1;
  walk.taken += 1;
  return { ...walk.group, n };
};

/**
 * The next `count` places (fewer when the groups run out), shared as evenly as possible between the
 * selected categories (`splitEvenly`: 5 places over 6 categories is one each for 5 of them, chosen at
 * random), then, inside a category, between its tiers (there are two in English), each place being the next
 * one of its group.
 */
const takeSlots = (walks: Walk[], count: number): Slot[] => {
  const byCategory = [...new Set(walks.map((walk) => walk.group.category))].map((category) =>
    walks.filter((walk) => walk.group.category === category),
  );
  const perCategory = splitEvenly(
    count,
    byCategory.map((group) => remaining(group)),
  );
  return byCategory.flatMap((group, index) =>
    splitEvenly(
      perCategory[index],
      group.map((walk) => walk.size - walk.taken),
    ).flatMap((taken, position) => Array.from({ length: taken }, () => takeFrom(group[position]))),
  );
};

/** What a game plugs into the draw: which fields number its places, how a document becomes its place, and
 * which read places it keeps. */
export type GroupedDrawOptions<T> = {
  /** Compass or Clues: finds a document's group and number (`numbering.ts`). */
  numbering: Numbering;
  /** Firestore field paths of the group's category and of the number (`compass.category` / `n`, ...). */
  categoryField: string;
  numberField: string;
  counts: CompassCounts;
  cursors: GroupCursors;
  saveCursors: (moved: GroupCursors) => void;
  categories: Category[];
  /** The stored tiers the pool reads: `[difficulty]`, plus the one below when a tier is filtered afterwards. */
  tiers: Difficulty[];
  rounds: number;
  toItem: (data: PlaceDoc, id: string) => T;
  /** Filters what was read (the English tier bump). */
  keep: (item: T) => boolean;
};

/**
 * Draws a game's places from Firestore, which has no "N random documents" query: places are numbered
 * 1..size inside their group (category x difficulty, in a shuffled order fixed once, see
 * `data/firestore/numbering.ts`), the group sizes are in `counts`, and each group has a cursor on this
 * device: a game takes the next places of its groups from there and moves the cursors on, wrapping at the end,
 * so a group is gone through completely before a place comes back; the first time, a group starts at a random
 * place. Several categories share the places as evenly as possible (`splitEvenly`). Everything is read with
 * one `or` query per 30 places (1 read per place); the first pass reads exactly what is needed (plus slack
 * when a tier needs filtering), a place missing or filtered out brings a next pass, doubling in size.
 *
 * Rejects when fewer than `rounds` places exist at all — the caller's start flow shows a notice and nothing
 * is started (cursors untouched).
 */
export const drawFromGroups = async <T>(options: GroupedDrawOptions<T>): Promise<T[]> => {
  const { numbering, categoryField, numberField, counts, cursors, categories, tiers, rounds, toItem, keep } = options;
  const walks: Walk[] = categories
    .flatMap((category) => tiers.map((tier) => ({ category, difficulty: tier })))
    .map((group) => ({ group, size: counts[group.category]?.[group.difficulty] ?? 0 }))
    .filter(({ size }) => size > 0)
    .map(({ group, size }) => {
      const key = groupKey(group);
      return { key, group, size, start: (cursors[key] ?? Math.floor(Math.random() * size)) % size, taken: 0 };
    });
  const total = remaining(walks);
  if (total < rounds) throw new Error(`Not enough places for this game (${total} found, ${rounds} needed)`);

  /** Reads the given slots (the `n`-th place of a group) with ONE query per 30 slots, whatever their groups:
   * an `or` of one `(category, difficulty, n in [...])` clause per group. The answer is a single list of
   * documents; a slot with no document (the sizes are read once per launch, the admin may have removed
   * places since) is just missing from it. */
  const readSlots = async (slots: Slot[]): Promise<Drawn<T>[]> => {
    const places = collection(db, COLLECTIONS.places);
    const queries = Array.from({ length: Math.ceil(slots.length / IN_LIMIT) }, (_, chunk) => {
      const byGroup = new Map<
        string,
        { category: Slot['category']; difficulty: Slot['difficulty']; numbers: number[] }
      >();
      for (const { category, difficulty, n } of slots.slice(chunk * IN_LIMIT, (chunk + 1) * IN_LIMIT)) {
        const id = groupKey({ category, difficulty });
        if (!byGroup.has(id)) byGroup.set(id, { category, difficulty, numbers: [] });
        byGroup.get(id)!.numbers.push(n);
      }
      const clauses = [...byGroup.values()].map(({ category, difficulty, numbers }) =>
        and(
          where(categoryField, '==', category),
          where('difficulty', '==', difficulty),
          where(numberField, 'in', numbers),
        ),
      );
      return getDocs(query(places, clauses.length === 1 ? clauses[0] : or(...clauses)));
    });
    return (await Promise.all(queries)).flatMap((snapshot) => {
      const drawn = snapshot.docs.map((document) => {
        const data = document.data() as PlaceDoc;
        const group = numbering.groupOf(data)!;
        return {
          id: document.id,
          data,
          item: toItem(data, document.id),
          slot: { ...group, n: numbering.numberOf(data)! },
        };
      });
      console.log(
        `[firestore] places: ${drawn.length} document(s) received`,
        drawn.map(
          ({ id, data, slot }) =>
            `${id} · ${data.name} (${data.code}) · ${slot.category}|${slot.difficulty} #${slot.n}`,
        ),
      );
      return drawn.map(({ item, slot }) => ({ item, slot }));
    });
  };

  const candidates: Drawn<T>[] = [];
  for (let pass = 1; candidates.length < rounds && remaining(walks) > 0; pass += 1) {
    const slots = takeSlots(walks, rounds * (tiers.length > 1 ? DRAW_PER_ROUND_WITH_BUMP : 1) * 2 ** (pass - 1));
    const read = await readSlots(slots);
    candidates.push(...read.filter(({ item }) => keep(item)));
  }
  if (candidates.length < rounds)
    throw new Error(`Not enough places for this game (${candidates.length} found, ${rounds} needed)`);

  // Every place taken counts as gone through, also the slack that was read but not kept.
  options.saveCursors(
    Object.fromEntries(
      walks.filter((walk) => walk.taken > 0).map((walk) => [walk.key, (walk.start + walk.taken) % walk.size]),
    ),
  );
  return shuffle(
    shuffle(candidates)
      .slice(0, rounds)
      .map(({ item }) => item),
  );
};

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

/** Stored difficulties that can display as `difficulty` once the English bump ran: in English a French place
 * is bumped one tier, so its stored tier is the one below. */
export const storedTiers = (difficulty: Difficulty, language: 'fr' | 'en'): Difficulty[] => {
  const below = DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(difficulty) - 1];
  return language === 'en' && below ? [difficulty, below] : [difficulty];
};
