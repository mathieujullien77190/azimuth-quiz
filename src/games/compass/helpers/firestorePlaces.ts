import { and, collection, getDocs, or, query, where } from 'firebase/firestore';

import type { Group, Slot } from '@/data/firestore/numbering';
import { compassFromDoc } from '@/data/firestore/read';
import { COLLECTIONS, type PlaceDoc } from '@/data/firestore/types';
import type { Language } from '@/i18n';
import type { Difficulty, GameSettings, Place } from '@/types';

import { db } from '@/helpers/firebase';
import { shuffle } from '@/helpers/random';

import { loadCompassCounts } from './compassCounts';
import { splitEvenly } from './splitEvenly';
import { groupKey, loadCompassCursors, saveCompassCursors } from './compassCursors';
import { effectiveDifficulty } from './places';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts`: `firebase/firestore` is
// ESM-only and crashes Jest for every test that imports the barrel for something unrelated.

/** Positions drawn per round when French places may be bumped a tier (English): only some of the ones
 * read from the tier below are kept, the rest is slack. In every other case each position drawn is kept. */
const DRAW_PER_ROUND_WITH_BUMP = 3;

/** Firestore's cap on the values of one `in` filter. */
const IN_LIMIT = 30;

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

/** A place read from Firestore, with the group and `n` it was read at. */
type Drawn = { place: Place; slot: Slot };

/** Stored difficulties that can display as `difficulty` once `effectiveDifficulty` ran: in English a
 * French place is bumped one tier, so its stored tier is the one below. */
const storedTiers = (difficulty: Difficulty, language: Language): Difficulty[] => {
  const below = DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(difficulty) - 1];
  return language === 'en' && below ? [difficulty, below] : [difficulty];
};

/** Reads the given slots (the `n`-th place of a group) with as few queries as possible: ONE query per 30
 * slots, whatever their groups — an `or` of one `(category, difficulty, n in [...])` clause per group, which
 * Firestore caps at 30 values in total. The answer is a single list of documents; a slot with no document
 * (the sizes are read once per launch, the admin may have removed places since) is just missing from it. */
const readSlots = async (slots: Slot[]): Promise<Drawn[]> => {
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
      and(where('compass.category', '==', category), where('difficulty', '==', difficulty), where('n', 'in', numbers)),
    );
    return getDocs(query(places, clauses.length === 1 ? clauses[0] : or(...clauses)));
  });
  return (await Promise.all(queries)).flatMap((snapshot) => {
    const drawn = snapshot.docs.map((document) => {
      const data = document.data() as PlaceDoc & { compass: NonNullable<PlaceDoc['compass']> };
      return {
        id: document.id,
        place: compassFromDoc(data),
        slot: { category: data.compass.category, difficulty: data.difficulty, n: data.n! },
      };
    });
    console.log(
      `[firestore] places: ${drawn.length} document(s) received`,
      drawn.map(
        ({ id, place, slot }) =>
          `${id} · ${place.name} (${place.code}) · ${slot.category}|${slot.difficulty} #${slot.n}`,
      ),
    );
    return drawn.map(({ place, slot }) => ({ place, slot }));
  });
};

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

/**
 * Draws the game's places from Firestore. It has no "N random documents" query, so Compass places are
 * numbered 1..size inside their group (category x difficulty, in a shuffled order fixed once, see
 * `data/firestore/numbering.ts`) and the group sizes live in `meta/compassCounts`. Each group has a cursor
 * on this device (`compassCursors.ts`): a game takes the next places of its groups from there and moves the
 * cursors on, wrapping at the end, so a group is gone through completely before a place comes back; the
 * first time, a group starts at a random place. With several categories selected, the places are shared
 * between them as evenly as possible (`splitEvenly`). Everything is read with one `or` query (1 read per place). The
 * difficulty is filtered by the query itself (it selects the groups); only in English, where a French place
 * is bumped one tier (`effectiveDifficulty`), the tier below is read too, with some slack, and filtered
 * afterwards. Only the host draws (the places are then written into the room), joiners never query.
 *
 * No fallback on the bundled list: rejects when Firestore fails or when fewer than `rounds` matching
 * places exist at all — the host's start flow shows a notice and nothing is started (cursors untouched).
 */
export const fetchRandomPlaces = async (settings: GameSettings, language: Language): Promise<Place[]> => {
  const { categories, difficulty, rounds } = settings;
  const cursors = await loadCompassCursors();
  const counts = await loadCompassCounts();
  const tiers = storedTiers(difficulty, language);
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

  // The first pass takes exactly what is needed (plus slack when a tier needs filtering); a place missing
  // or filtered out brings a next pass, doubling in size, until the groups run out.
  const candidates: Drawn[] = [];
  for (let pass = 1; candidates.length < rounds && remaining(walks) > 0; pass += 1) {
    const slots = takeSlots(walks, rounds * (tiers.length > 1 ? DRAW_PER_ROUND_WITH_BUMP : 1) * 2 ** (pass - 1));
    const read = await readSlots(slots);
    candidates.push(...read.filter(({ place }) => effectiveDifficulty(place, language) === difficulty));
  }
  if (candidates.length < rounds)
    throw new Error(`Not enough places for this game (${candidates.length} found, ${rounds} needed)`);

  // Every place taken counts as gone through, also the slack that was read but not kept.
  saveCompassCursors(
    Object.fromEntries(
      walks.filter((walk) => walk.taken > 0).map((walk) => [walk.key, (walk.start + walk.taken) % walk.size]),
    ),
  );
  return shuffle(
    shuffle(candidates)
      .slice(0, rounds)
      .map(({ place }) => place),
  );
};
