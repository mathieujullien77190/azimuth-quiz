import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import { slotAt, type Slot } from '@/data/firestore/numbering';
import { compassFromDoc } from '@/data/firestore/read';
import { COLLECTIONS, COMPASS_COUNTS_DOC, type CompassCountsDoc, type PlaceDoc } from '@/data/firestore/types';
import { MIN_PLACE_DISTANCE_KM } from '@/games/compass/constants';
import type { Language } from '@/i18n';
import type { Coordinates, Difficulty, GameSettings, Place } from '@/types';

import { distanceKm } from '@/helpers/geo';
import { db } from '@/helpers/firebase';
import { shuffle } from '@/helpers/random';

import { effectiveDifficulty } from './places';
import { forgetCompassGroups, groupKey, hasPlayed, loadCompassHistory, recordCompassPlays } from './placeHistory';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts`: `firebase/firestore` is
// ESM-only and crashes Jest for every test that imports the barrel for something unrelated.

/** Positions drawn per round on the first pass: slack for the difficulty and distance filters. */
const DRAW_PER_ROUND = 3;

/** Firestore's cap on the values of one `in` filter. */
const IN_LIMIT = 30;

/** Passes after which enough (but too close) places are taken as is instead of reading the whole pool. */
const MAX_FAR_PASSES = 3;

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

/** A place read from Firestore, with the group and `n` it was read at (what the history remembers). */
type Drawn = { place: Place; slot: Slot };

/** Stored difficulties that can display as `difficulty` once `effectiveDifficulty` ran: in English a
 * French place is bumped one tier, so its stored tier is the one below. */
const storedTiers = (difficulty: Difficulty, language: Language): Difficulty[] => {
  const below = DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(difficulty) - 1];
  return language === 'en' && below ? [difficulty, below] : [difficulty];
};

/** Reads the given slots (`n`-th place of a group) with one query per group and chunk of 30. */
const readSlots = async (slots: Slot[]): Promise<Drawn[]> => {
  const byGroup = new Map<string, { category: Slot['category']; difficulty: Slot['difficulty']; numbers: number[] }>();
  for (const { category, difficulty, n } of slots) {
    const id = groupKey({ category, difficulty });
    if (!byGroup.has(id)) byGroup.set(id, { category, difficulty, numbers: [] });
    byGroup.get(id)!.numbers.push(n);
  }
  const places = collection(db, COLLECTIONS.places);
  const queries = [...byGroup.values()].flatMap(({ category, difficulty, numbers }) =>
    Array.from({ length: Math.ceil(numbers.length / IN_LIMIT) }, (_, chunk) =>
      getDocs(
        query(places, where('compass.category', '==', category), where('difficulty', '==', difficulty), where('n', 'in', numbers.slice(chunk * IN_LIMIT, (chunk + 1) * IN_LIMIT))),
      ),
    ),
  );
  return (await Promise.all(queries)).flatMap((snapshot) =>
    snapshot.docs.map((document) => {
      const data = document.data() as PlaceDoc & { compass: NonNullable<PlaceDoc['compass']> };
      return { place: compassFromDoc(data), slot: { category: data.compass.category, difficulty: data.difficulty, n: data.n! } };
    }),
  );
};

/**
 * Draws the game's places from Firestore. It has no "N random documents" query, so Compass places are
 * numbered 1..size inside their group (category x difficulty, see `data/firestore/numbering.ts`) and the
 * group sizes live in `meta/compassCounts`: one read for the sizes, then random positions over the groups
 * the game selected, then `n in [...]` queries (1 read per place). In English a French place is bumped one
 * difficulty tier (`effectiveDifficulty`), so the tier below is drawn from too and filtered afterwards.
 * Places too close to the starting point are dropped, unless too few are far enough — the nearer ones
 * complete the draw. Only the host draws (the places are then written into the room), joiners never query.
 *
 * Variety: the numbers already played on this device (`placeHistory.ts`) come last in the random order, so
 * the draw takes new places whenever enough exist; once the whole pool has been seen, its history is
 * forgotten and the cycle starts over. The places returned are recorded as played.
 *
 * No fallback on the bundled list: rejects when Firestore fails or when fewer than `rounds` matching
 * places exist at all — the host's start flow shows a notice and nothing is started.
 */
export const fetchRandomPlaces = async (origin: Coordinates, settings: GameSettings, language: Language): Promise<Place[]> => {
  const { categories, difficulty, rounds } = settings;
  const history = await loadCompassHistory();
  const countsSnapshot = await getDoc(doc(db, COMPASS_COUNTS_DOC.collection, COMPASS_COUNTS_DOC.id));
  const { counts } = (countsSnapshot.data() ?? { counts: {} }) as CompassCountsDoc;
  const pool = categories.flatMap((category) =>
    storedTiers(difficulty, language).map((tier) => ({ category, difficulty: tier, size: counts[category]?.[tier] ?? 0 })),
  ).filter(({ size }) => size > 0);
  const total = pool.reduce((sum, { size }) => sum + size, 0);
  if (total < rounds) throw new Error(`Not enough places for this game (${total} found, ${rounds} needed)`);

  // Every position once, in random order — the ones never played on this device first. Everything
  // already seen: the pool's history is forgotten so the cycle starts over.
  const positions = Array.from({ length: total }, (_, position) => position);
  const seen = positions.filter((position) => hasPlayed(history, slotAt(pool, position)));
  const seenSet = new Set(seen);
  const unseen = positions.filter((position) => !seenSet.has(position));
  if (unseen.length === 0) forgetCompassGroups(pool.map(groupKey));
  const order = unseen.length === 0 ? shuffle(positions) : [...shuffle(unseen), ...shuffle(seen)];

  // Each pass reads the next slice of that order, doubling in size.
  const candidates: Drawn[] = [];
  const isFar = ({ place }: Drawn) => distanceKm(origin, place.coordinates) >= MIN_PLACE_DISTANCE_KM;
  let drawn = 0;
  for (let pass = 1; drawn < total; pass += 1) {
    const size = DRAW_PER_ROUND * rounds * 2 ** (pass - 1);
    const slots = order.slice(drawn, drawn + size).map((position) => slotAt(pool, position));
    drawn += size;
    const read = await readSlots(slots);
    candidates.push(...read.filter(({ place }) => effectiveDifficulty(place, language) === difficulty));
    if (candidates.filter(isFar).length >= rounds || (candidates.length >= rounds && pass >= MAX_FAR_PASSES)) break;
  }
  if (candidates.length < rounds) throw new Error(`Not enough places for this game (${candidates.length} found, ${rounds} needed)`);

  const farOnes = candidates.filter(isFar);
  const near = candidates
    .filter((candidate) => !farOnes.includes(candidate))
    .sort((a, b) => distanceKm(origin, b.place.coordinates) - distanceKm(origin, a.place.coordinates));
  // A pass can read the whole (small) pool at once: the choice itself also puts new places first.
  const isNew = ({ slot }: Drawn) => !hasPlayed(history, slot);
  const farOrdered = [...shuffle(farOnes.filter(isNew)), ...shuffle(farOnes.filter((candidate) => !isNew(candidate)))];
  const chosen = [...farOrdered, ...near].slice(0, rounds);
  recordCompassPlays(chosen.map(({ slot }) => slot));
  return shuffle(chosen.map(({ place }) => place));
};
