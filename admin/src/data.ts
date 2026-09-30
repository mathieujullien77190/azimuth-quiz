import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore';

import { contourRingFields, contoursNeedingRings } from '@/data/firestore/contourRings';
import { planCountryChange } from '@/data/firestore/denormalize';
import { planJobChange, planRiddleChange } from '@/data/firestore/denormalizeClues';
import { CLUES_NUMBERING, cluesCategory, COMPASS_NUMBERING, planRegroup } from '@/data/firestore/numbering';
import { contourFromDoc } from '@/data/firestore/read';
import { normalizeSyllable } from '@/data/firestore/riddles';
import {
  CLUES_COUNTS_DOC,
  COLLECTIONS,
  COMPASS_COUNTS_DOC,
  DATA_VERSION_DOC,
  type CluesCountsDoc,
  type CompassCounts,
  type CompassCountsDoc,
  type ContourCountryDoc,
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
 * the source of truth. The whole thing is ~2.8k small documents.
 */
type Cache = {
  places: Record<string, PlaceDoc>;
  countries: Record<string, CountryDoc>;
  /** `contours/{code}`: one document per silhouette. */
  contours: Record<string, ContourCountryDoc>;
  /** `charadeRiddles`, flattened to `syllable -> riddle`. */
  riddles: Record<string, string | null>;
  jobs: Record<string, JobDoc>;
  /** `meta/compassCounts`: size of every Compass group, see `numbering.ts`. */
  compassCounts: CompassCounts;
  /** `meta/compassCounts.shuffled`: kept as it is when the numbering is maintained (see `applyPlaceChange`). */
  compassShuffled: boolean;
  /** `meta/cluesCounts`, same for the Clues groups (`clues.category` x difficulty). */
  cluesCounts: CompassCounts;
  cluesShuffled: boolean;
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

const readMeta = async <T>({ collection: name, id }: { collection: string; id: string }): Promise<T | undefined> =>
  (await getDoc(doc(db, name, id))).data() as T | undefined;

const fetchAll = async (): Promise<Cache> => {
  const [places, countries, contours, riddles, jobs, compass, clues] = await Promise.all([
    readCollection<PlaceDoc>(COLLECTIONS.places),
    readCollection<CountryDoc>(COLLECTIONS.countries),
    readCollection<ContourCountryDoc>(COLLECTIONS.contours),
    readCollection<{ riddle: string | null }>(COLLECTIONS.charadeRiddles),
    readCollection<JobDoc>(COLLECTIONS.personalityJobs),
    readMeta<CompassCountsDoc>(COMPASS_COUNTS_DOC),
    readMeta<CluesCountsDoc>(CLUES_COUNTS_DOC),
  ]);
  return {
    places,
    countries,
    contours,
    riddles: Object.fromEntries(Object.entries(riddles).map(([syllable, { riddle }]) => [syllable, riddle])),
    jobs,
    compassCounts: compass?.counts ?? {},
    compassShuffled: compass?.shuffled === true,
    cluesCounts: clues?.counts ?? {},
    cluesShuffled: clues?.shuffled === true,
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

/** Reads Firestore in full (~2.8k reads) and replaces the local copy. */
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
    cache = snapshot.cache;
    syncedAt = snapshot.syncedAt;
    contoursMemo = null;
    return;
  }
  await syncData();
};

/** When the local copy was last read from Firestore (ms). */
export const lastSyncedAt = (): number => syncedAt;

/** A country's French name from the loaded data (its code when unknown). */
export const countryName = (code: string): string => data().countries[code]?.fr ?? code;

/** The loaded data — `AuthGate` renders nothing that reads it before `loadData` resolved. */
export const data = (): Cache => {
  if (!cache) throw new Error('Données non chargées');
  return cache;
};

/** Every country's silhouette, decoded once (invalidated by any contour write). */
export const contours = (): ContourCountry[] => {
  contoursMemo ??= Object.entries(data().contours).map(([code, contour]) => contourFromDoc(code, contour));
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

/** Rewrites `contours/{code}` (a neighbor moved, the label anchor moved...). */
export const putContour = async (code: string, value: ContourCountryDoc): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.contours, code), value);
  data().contours[code] = value;
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

/** Runs `operations` in batches of at most `BATCH_SIZE` (Firestore's cap is 500 per batch), each batch
 * atomic; the data version is bumped in the last one. */
const commitInBatches = async (operations: ((batch: WriteBatch) => void)[]): Promise<void> => {
  for (let start = 0; start < operations.length || start === 0; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = operations.slice(start, start + BATCH_SIZE);
    for (const operation of chunk) operation(batch);
    if (start + BATCH_SIZE >= operations.length) {
      batch.set(doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id), versionBump, { merge: true });
    }
    await batch.commit();
  }
};

// --- One-off: encoded outlines, neighbours embedded ----------------------------------------------------------

/** True while some silhouette lacks (up to date) its encoded `ring` and the `neighborRings` copied from its neighbours. */
export const contourRingsPending = (): boolean => contoursNeedingRings(data().contours).length > 0;

/**
 * Adds `ring` and `neighborRings` to the silhouettes that lack them (merge: nothing else is touched), so a game
 * round reads ONE document. Computed from the loaded documents, written in batches; safe to run again.
 */
export const encodeContourRings = async (onProgress: (done: number, total: number) => void): Promise<void> => {
  const docs = data().contours;
  const codes = contoursNeedingRings(docs);
  const fields = Object.fromEntries(codes.map((code) => [code, contourRingFields(docs[code], docs)]));
  onProgress(0, codes.length);
  await commitInBatches(
    codes.map(
      (code) => (batch: WriteBatch) => batch.set(doc(db, COLLECTIONS.contours, code), fields[code], { merge: true }),
    ),
  );
  for (const code of codes) Object.assign(docs[code], fields[code]);
  contoursMemo = null;
  persist();
  onProgress(codes.length, codes.length);
};

// --- Copies kept in sync with their source --------------------------------------------------------------------

/**
 * Writes `next` as `countries/{code}` and rewrites, in the same run of batches, every copy of it: the
 * country of each of its places and the names in the contours that cite it (see `planCountryChange`).
 */
export const applyCountryChange = async (code: string, next: CountryDoc): Promise<void> => {
  const plan = planCountryChange(code, next, data().places, data().contours);
  await commitInBatches([
    (batch) => batch.set(doc(db, COLLECTIONS.countries, code), next),
    ...Object.entries(plan.places).map(
      ([key, place]) =>
        (batch: WriteBatch) =>
          batch.update(doc(db, COLLECTIONS.places, key), { country: place.country }),
    ),
    ...Object.entries(plan.contours).map(
      ([contourCode, contour]) =>
        (batch: WriteBatch) =>
          batch.set(doc(db, COLLECTIONS.contours, contourCode), contour),
    ),
  ]);
  data().countries[code] = next;
  Object.assign(data().places, plan.places);
  Object.assign(data().contours, plan.contours);
  contoursMemo = null;
  persist();
};

/**
 * Writes the riddle of `syllable` (`null`: cleared) as `charadeRiddles/{normalized syllable}` and rewrites, in the
 * same run of batches, the `clues.riddles` of every place holding that syllable (see `planRiddleChange`).
 */
export const applyRiddleChange = async (syllable: string, riddle: string | null): Promise<void> => {
  const id = normalizeSyllable(syllable);
  const plan = planRiddleChange(syllable, riddle, data().places, data().riddles);
  await commitInBatches([
    (batch) => batch.set(doc(db, COLLECTIONS.charadeRiddles, id), { riddle }),
    ...Object.entries(plan).map(
      ([key, place]) =>
        (batch: WriteBatch) =>
          batch.set(doc(db, COLLECTIONS.places, key), place),
    ),
  ]);
  data().riddles[id] = riddle;
  Object.assign(data().places, plan);
  persist();
};

/** Writes job `code` as `personalityJobs/{code}` and copies its label into every personality tagged with it. */
export const applyJobChange = async (code: string, job: JobDoc): Promise<void> => {
  const plan = planJobChange(code, job, data().places);
  await commitInBatches([
    (batch) => batch.set(doc(db, COLLECTIONS.personalityJobs, code), job),
    ...Object.entries(plan).map(
      ([key, place]) =>
        (batch: WriteBatch) =>
          batch.set(doc(db, COLLECTIONS.places, key), place),
    ),
  ]);
  data().jobs[code] = job;
  Object.assign(data().places, plan);
  persist();
};

// --- Editing places ----------------------------------------------------------------------------------------------

/**
 * Writes `next` as the new `places/{key}` document (`null` = delete it) and keeps both numberings dense in
 * the SAME batch (see `planRegroup`): the place leaving a group frees its number for that group's last
 * place, the one joining a group goes last, `meta/compassCounts` and `meta/cluesCounts` follow. The Clues
 * category is derived from the Compass one, so a Compass category change also regroups the Clues numbering.
 */
export const applyPlaceChange = async (key: string, next: PlaceDoc | null): Promise<void> => {
  const { places, compassCounts, cluesCounts } = data();
  const written: PlaceDoc | null = next && {
    ...next,
    ...(next.clues && { clues: { ...next.clues, category: cluesCategory(next) } }),
  };
  const compass = planRegroup(places, compassCounts, key, written, COMPASS_NUMBERING);
  const clues = planRegroup(places, cluesCounts, key, written, CLUES_NUMBERING);
  if (written) {
    if (compass.n === null) delete written.n;
    else written.n = compass.n;
    if (written.clues) {
      if (clues.n === null) delete written.clues.n;
      else written.clues.n = clues.n;
    }
  }
  const batch = writeBatch(db);
  if (written) batch.set(doc(db, COLLECTIONS.places, key), written);
  else batch.delete(doc(db, COLLECTIONS.places, key));
  for (const [otherKey, n] of Object.entries(compass.moved)) batch.update(doc(db, COLLECTIONS.places, otherKey), { n });
  for (const [otherKey, n] of Object.entries(clues.moved)) {
    batch.update(doc(db, COLLECTIONS.places, otherKey), { 'clues.n': n });
  }
  batch.set(doc(db, COMPASS_COUNTS_DOC.collection, COMPASS_COUNTS_DOC.id), {
    counts: compass.counts,
    ...(data().compassShuffled && { shuffled: true as const }),
  } satisfies CompassCountsDoc);
  batch.set(doc(db, CLUES_COUNTS_DOC.collection, CLUES_COUNTS_DOC.id), {
    counts: clues.counts,
    ...(data().cluesShuffled && { shuffled: true as const }),
  } satisfies CluesCountsDoc);
  batch.set(doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id), versionBump, { merge: true });
  await batch.commit();
  if (written) places[key] = written;
  else delete places[key];
  for (const [otherKey, n] of Object.entries(compass.moved)) places[otherKey].n = n;
  for (const [otherKey, n] of Object.entries(clues.moved)) places[otherKey].clues!.n = n;
  data().compassCounts = compass.counts;
  data().cluesCounts = clues.counts;
  persist();
};
