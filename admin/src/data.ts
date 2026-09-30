import { collection, deleteDoc, doc, getDoc, getDocs, increment, setDoc, writeBatch } from 'firebase/firestore';

import { unflattenPoints } from '@/data/firestore/build';
import { computeNumbering, isNumberingConsistent, planRegroup } from '@/data/firestore/numbering';
import {
  COLLECTIONS,
  COMPASS_COUNTS_DOC,
  DATA_VERSION_DOC,
  type CompassCounts,
  type CompassCountsDoc,
  type CountryDoc,
  type JobDoc,
  type PlaceDoc,
} from '@/data/firestore/types';
import type { ContourCountry } from '@/types';

import { db } from './firebase';
import { readSnapshot, writeSnapshot } from './snapshotStore';

/**
 * The admin's copy of the game data. Kept in memory for synchronous reads by the views, and mirrored
 * in IndexedDB (`snapshotStore`) so opening the admin costs no Firestore read at all: it only
 * reads Firestore on the very first load or when the "Synchroniser" button asks for it (`syncData`).
 * Every write goes to Firestore first, then updates this copy and its stored mirror — Firestore stays
 * the source of truth. The whole thing is ~2.6k small documents.
 */
type Cache = {
  places: Record<string, PlaceDoc>;
  countries: Record<string, CountryDoc>;
  /** `charadeRiddles`, flattened to `syllable -> riddle`. */
  riddles: Record<string, string | null>;
  jobs: Record<string, JobDoc>;
  /** `meta/compassCounts`: size of every Compass group, see `numbering.ts`. */
  compassCounts: CompassCounts;
  /** `meta/compassCounts.shuffled`: the numbering follows the shuffled order (see `shuffleRank`). */
  compassShuffled: boolean;
};

let cache: Cache | null = null;
let contoursMemo: ContourCountry[] | null = null;

const readCollection = async <T>(name: string): Promise<Record<string, T>> => {
  const { docs } = await getDocs(collection(db, name));
  console.groupCollapsed(`[firestore] ${name}: ${docs.length} document(s) received`);
  console.log(docs.map((snapshot) => snapshot.id));
  console.groupEnd();
  return Object.fromEntries(docs.map((snapshot) => [snapshot.id, snapshot.data() as T]));
};

const fetchAll = async (): Promise<Cache> => {
  const [places, countries, riddles, jobs, counts] = await Promise.all([
    readCollection<PlaceDoc>(COLLECTIONS.places),
    readCollection<CountryDoc>(COLLECTIONS.countries),
    readCollection<{ riddle: string | null }>(COLLECTIONS.charadeRiddles),
    readCollection<JobDoc>(COLLECTIONS.personalityJobs),
    getDoc(doc(db, COMPASS_COUNTS_DOC.collection, COMPASS_COUNTS_DOC.id)),
  ]);
  return {
    places,
    countries,
    riddles: Object.fromEntries(Object.entries(riddles).map(([syllable, { riddle }]) => [syllable, riddle])),
    jobs,
    compassCounts: (counts.data() as CompassCountsDoc | undefined)?.counts ?? {},
    compassShuffled: (counts.data() as CompassCountsDoc | undefined)?.shuffled === true,
  };
};

type Snapshot = { cache: Cache; syncedAt: number };

let syncedAt = 0;
let persistTimer: ReturnType<typeof setTimeout> | undefined;

const persist = () => {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (cache) void writeSnapshot({ cache, syncedAt } satisfies Snapshot);
  }, 300);
};

/** Reads Firestore in full (~2.6k reads) and replaces the local copy. */
export const syncData = async (): Promise<void> => {
  cache = await fetchAll();
  syncedAt = Date.now();
  contoursMemo = null;
  await writeSnapshot({ cache, syncedAt } satisfies Snapshot);
};

/** Local copy if there is one (no Firestore read), else a first full sync. */
export const loadData = async (): Promise<void> => {
  const snapshot = await readSnapshot<Snapshot>();
  if (snapshot) {
    // A local copy saved before `meta/compassCounts` existed has no counts: the numbering screen shows up.
    cache = {
      ...snapshot.cache,
      compassCounts: snapshot.cache.compassCounts ?? {},
      compassShuffled: snapshot.cache.compassShuffled ?? false,
    };
    syncedAt = snapshot.syncedAt;
    contoursMemo = null;
    return;
  }
  await syncData();
};

/** When the local copy was last read from Firestore (ms). */
export const lastSyncedAt = (): number => syncedAt;

/** The loaded data — `AuthGate` renders nothing that reads it before `loadData` resolved. */
export const data = (): Cache => {
  if (!cache) throw new Error('Données non chargées');
  return cache;
};

/** Every country's silhouette, decoded once (invalidated by any country write). */
export const contours = (): ContourCountry[] => {
  contoursMemo ??= Object.entries(data().countries).flatMap(([code, country]) =>
    country.contour
      ? [
          {
            code,
            points: unflattenPoints(country.contour.points),
            neighbors: country.contour.neighbors ?? [],
            centerLabel: country.contour.centerLabel ?? { x: 0.5, y: 0.5 },
            difficulty: country.contour.difficulty ?? 'intermediate',
          },
        ]
      : [],
  );
  return contoursMemo;
};

const bumpVersion = () =>
  setDoc(
    doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id),
    { version: increment(1), updatedAt: Date.now() },
    { merge: true },
  );

export const putPlace = async (key: string, value: PlaceDoc): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.places, key), value);
  data().places[key] = value;
  persist();
  await bumpVersion();
};

export const removePlace = async (key: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.places, key));
  delete data().places[key];
  persist();
  await bumpVersion();
};

export const putCountry = async (code: string, value: CountryDoc): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.countries, code), value);
  data().countries[code] = value;
  contoursMemo = null;
  persist();
  await bumpVersion();
};

export const putRiddle = async (syllable: string, riddle: string | null): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.charadeRiddles, syllable), { riddle });
  data().riddles[syllable] = riddle;
  persist();
  await bumpVersion();
};

export const putJob = async (code: string, value: JobDoc): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.personalityJobs, code), value);
  data().jobs[code] = value;
  persist();
  await bumpVersion();
};

export const removeJob = async (code: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.personalityJobs, code));
  delete data().jobs[code];
  persist();
  await bumpVersion();
};

const BATCH_SIZE = 400;

const versionBump = { version: increment(1), updatedAt: Date.now() };

/** True while the Compass numbering (`PlaceDoc.n` + `meta/compassCounts`) is missing or inconsistent. */
export const compassNumberingBroken = (): boolean => !isNumberingConsistent(data().places, data().compassCounts);

/** True while the Compass numbering is missing, inconsistent or not shuffled yet: the game's cursor draw
 * depends on it (consecutive `n` must look random), `AuthGate` asks for the one-off numbering first. */
export const compassNumberingPending = (): boolean => compassNumberingBroken() || !data().compassShuffled;

/** One-off: numbers every Compass place inside its group in the shuffled order (`force`: even a group that was
 * already dense, numbered in the import order) and writes the places' `n` (merge, nothing else touched) plus
 * `meta/compassCounts`, marked `shuffled`. */
export const numberCompassPlaces = async (onProgress: (done: number, total: number) => void): Promise<void> => {
  const { numbers, counts } = computeNumbering(Object.entries(data().places), { force: true });
  const changed = Object.entries(numbers).filter(([key, n]) => data().places[key].n !== n);
  for (let start = 0; start < changed.length; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = changed.slice(start, start + BATCH_SIZE);
    for (const [key, n] of chunk) batch.set(doc(db, COLLECTIONS.places, key), { n }, { merge: true });
    await batch.commit();
    for (const [key, n] of chunk) data().places[key].n = n;
    onProgress(start + chunk.length, changed.length);
  }
  await setDoc(doc(db, COMPASS_COUNTS_DOC.collection, COMPASS_COUNTS_DOC.id), {
    counts,
    shuffled: true,
  } satisfies CompassCountsDoc);
  data().compassCounts = counts;
  data().compassShuffled = true;
  persist();
  await bumpVersion();
};

/**
 * Writes `next` as the new `places/{key}` document (`null` = delete it) and keeps the Compass numbering
 * dense in the SAME batch (see `planRegroup`): the place leaving a group frees its `n` for that group's last
 * place, the one joining a group goes last, `meta/compassCounts` follows. Only Compass places are numbered.
 */
export const applyPlaceChange = async (key: string, next: PlaceDoc | null): Promise<void> => {
  const { places, compassCounts } = data();
  const plan = planRegroup(places, compassCounts, key, next);
  const written = next && { ...next };
  if (written) {
    if (plan.n === null) delete written.n;
    else written.n = plan.n;
  }
  const batch = writeBatch(db);
  if (written) batch.set(doc(db, COLLECTIONS.places, key), written);
  else batch.delete(doc(db, COLLECTIONS.places, key));
  for (const [otherKey, n] of Object.entries(plan.moved)) batch.update(doc(db, COLLECTIONS.places, otherKey), { n });
  batch.set(doc(db, COMPASS_COUNTS_DOC.collection, COMPASS_COUNTS_DOC.id), {
    counts: plan.counts,
    ...(data().compassShuffled && { shuffled: true as const }),
  } satisfies CompassCountsDoc);
  batch.set(doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id), versionBump, { merge: true });
  await batch.commit();
  if (written) places[key] = written;
  else delete places[key];
  for (const [otherKey, n] of Object.entries(plan.moved)) places[otherKey].n = n;
  data().compassCounts = plan.counts;
  persist();
};
