import { collection, documentId, getDocs, query, where } from 'firebase/firestore';

import { backdropFromDoc, hasSilhouette, roundCountryFromDoc } from '@/data/firestore/read';
import { COLLECTIONS, type CountryDoc } from '@/data/firestore/types';
import type { ContourCountry, ContourRoundCountry, ContourSettings } from '@/types';

import { db } from '@/helpers/firebase';
import { shuffle } from '@/helpers/random';

import { loadContourCounts } from './contourCounts';
import { loadContourCursors, saveContourCursors } from './contourCursors';

// Not re-exported from `helpers/index.ts`'s barrel, same reason as `room.ts`: `firebase/firestore` is
// ESM-only and crashes Jest for every test that imports the barrel for something unrelated.

/** Firestore's cap on the values of one `in` filter. */
const IN_LIMIT = 30;

/** The `countries/{code}` documents read so far in this session (`null`: known to be absent, so it is not asked
 * again). A silhouette country weighs a few KB: a session only ever holds the rounds it played. */
const documents = new Map<string, CountryDoc | null>();

const chunked = <T>(items: T[]): T[][] =>
  Array.from({ length: Math.ceil(items.length / IN_LIMIT) }, (_, index) =>
    items.slice(index * IN_LIMIT, (index + 1) * IN_LIMIT),
  );

/** Keeps what a query returned in memory. */
const remember = (snapshots: Awaited<ReturnType<typeof getDocs>>[]): string[] => {
  const ids = snapshots.flatMap((snapshot) => snapshot.docs.map((document) => document.id));
  for (const snapshot of snapshots)
    for (const document of snapshot.docs) documents.set(document.id, document.data() as CountryDoc);
  return ids;
};

/** Reads the documents of `codes` that are not in memory yet: ONE query per 30 codes (`documentId() in [...]`,
 * 1 read per document). A code without a document is remembered as absent. */
const readDocuments = async (codes: string[]): Promise<void> => {
  const missing = [...new Set(codes)].filter((code) => !documents.has(code));
  if (missing.length === 0) return;
  const countries = collection(db, COLLECTIONS.countries);
  const snapshots = await Promise.all(
    chunked(missing).map((chunk) => getDocs(query(countries, where(documentId(), 'in', chunk)))),
  );
  remember(snapshots);
  for (const code of missing) if (!documents.has(code)) documents.set(code, null);
};

/** `length` codes made of `codes` shuffled over and over, without the same one twice in a row when there is a choice. */
const repeatTo = (codes: string[], length: number): string[] => {
  const result: string[] = [];
  while (result.length < length) {
    const round = shuffle(codes);
    if (result.length > 0 && round.length > 1 && round[0] === result[result.length - 1]) round.push(round.shift()!);
    result.push(...round);
  }
  return result.slice(0, length);
};

/**
 * Draws the game's countries from Firestore, the same way Compass and Clues draw their places: silhouette
 * countries are numbered `n` = 1..size inside their difficulty group (shuffled order, fixed once — see
 * `data/firestore/numbering.ts`), the sizes are in `meta/contourCounts`, and this device has a cursor per
 * difficulty: a game takes the next countries from there and moves it on, wrapping at the end, so a group is
 * gone through completely before a country comes back; the first time it starts at a random country. One
 * query per 30 numbers (`difficulty == d`, `n in [...]`, 1 read per country); a number with no document (the
 * admin removed it since) brings a further query. Only the host draws — the room carries the codes only.
 *
 * A group smaller than the number of rounds (there are 2 easy countries) is gone through again and again, never
 * the same country twice in a row when there is a choice — as the game always did. No fallback on the bundled
 * list: rejects when Firestore fails or when the group has no country at all.
 */
export const fetchContourRoundCodes = async (
  settings: Pick<ContourSettings, 'difficulty' | 'rounds'>,
): Promise<string[]> => {
  const { difficulty, rounds } = settings;
  const cursors = await loadContourCursors();
  const counts = await loadContourCounts();
  const size = counts[difficulty] ?? 0;
  if (size === 0) throw new Error(`Not enough countries for this game (0 found, ${rounds} needed)`);
  const wanted = Math.min(rounds, size);

  const start = (cursors[difficulty] ?? Math.floor(Math.random() * size)) % size;
  const codes: string[] = [];
  let taken = 0;
  while (codes.length < wanted && taken < size) {
    const count = Math.min(wanted - codes.length, size - taken, IN_LIMIT);
    const numbers = Array.from({ length: count }, (_, index) => ((start + taken + index) % size) + 1);
    taken += count;
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.countries), where('difficulty', '==', difficulty), where('n', 'in', numbers)),
    );
    codes.push(...remember([snapshot]));
  }
  if (codes.length < wanted)
    throw new Error(`Not enough countries for this game (${codes.length} found, ${wanted} needed)`);

  saveContourCursors({ [difficulty]: (start + taken) % size });
  return repeatTo(codes, rounds);
};

/** What a round draws: the target country and the rings of the countries around it (the backdrop and the
 * border split, see `computeBorders`). */
export type RoundData = { country: ContourRoundCountry; neighborCountries: ContourCountry[] };

const rounds = new Map<string, Promise<RoundData>>();

/**
 * Everything one round needs, from ONE document: the country's `countries/{code}`, which carries its outline,
 * its neighbours (hints with their position, backdrop with their outline), capital and cities. Shared and kept
 * for the session, so the next round can be loaded while the current one is played (`useRoundData`) and a round
 * change shows no wait. A failed load is forgotten: the next call tries again.
 */
export const loadRoundData = (code: string): Promise<RoundData> => {
  let round = rounds.get(code);
  if (round === undefined) {
    round = (async () => {
      await readDocuments([code]);
      const document = documents.get(code);
      if (!document || !hasSilhouette(document)) throw new Error(`No silhouette for ${code}`);
      return { country: roundCountryFromDoc(code, document), neighborCountries: backdropFromDoc(document) };
    })();
    rounds.set(code, round);
    round.catch(() => rounds.delete(code));
  }
  return round;
};

/** Forgets everything read (the next round reads Firestore again). */
export const clearContourDocuments = (): void => {
  documents.clear();
  rounds.clear();
};
