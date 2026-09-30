import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore';

import { buildContourDocs, computeContourNumbering, isContourNumberingConsistent } from '@/data/firestore/contourDocs';
import { countrySnapshot, placesNeedingCountry, planCountryChange } from '@/data/firestore/denormalize';
import {
  placesNeedingClueCopies,
  planJobChange,
  planRiddleChange,
  withJobLabel,
  withRiddles,
} from '@/data/firestore/denormalizeClues';
import {
  CLUES_NUMBERING,
  cluesCategory,
  COMPASS_NUMBERING,
  computeNumbering,
  isNumberingConsistent,
  planRegroup,
} from '@/data/firestore/numbering';
import { contourFromDoc } from '@/data/firestore/read';
import { normalizeSyllable } from '@/data/firestore/riddles';
import {
  CLUES_COUNTS_DOC,
  COLLECTIONS,
  COMPASS_COUNTS_DOC,
  CONTOUR_COUNTS_DOC,
  DATA_VERSION_DOC,
  type CluesCountsDoc,
  type CompassCounts,
  type CompassCountsDoc,
  type ContourCountryDoc,
  type ContourCounts,
  type ContourCountsDoc,
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
  /** `contours/{code}`: one document per silhouette (moved out of `countries/{code}.contour`). */
  contours: Record<string, ContourCountryDoc>;
  /** `charadeRiddles`, flattened to `syllable -> riddle`. */
  riddles: Record<string, string | null>;
  jobs: Record<string, JobDoc>;
  /** `meta/compassCounts`: size of every Compass group, see `numbering.ts`. */
  compassCounts: CompassCounts;
  /** `meta/compassCounts.shuffled`: the numbering follows the shuffled order (see `shuffleRank`). */
  compassShuffled: boolean;
  /** `meta/cluesCounts`, same for the Clues groups (`clues.category` x difficulty). */
  cluesCounts: CompassCounts;
  cluesShuffled: boolean;
  /** `meta/contourCounts`: size of every silhouette difficulty group. */
  contourCounts: ContourCounts;
  contourShuffled: boolean;
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
  const [places, countries, contours, riddles, jobs, compass, clues, contour] = await Promise.all([
    readCollection<PlaceDoc>(COLLECTIONS.places),
    readCollection<CountryDoc>(COLLECTIONS.countries),
    readCollection<ContourCountryDoc>(COLLECTIONS.contours),
    readCollection<{ riddle: string | null }>(COLLECTIONS.charadeRiddles),
    readCollection<JobDoc>(COLLECTIONS.personalityJobs),
    readMeta<CompassCountsDoc>(COMPASS_COUNTS_DOC),
    readMeta<CluesCountsDoc>(CLUES_COUNTS_DOC),
    readMeta<ContourCountsDoc>(CONTOUR_COUNTS_DOC),
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
    contourCounts: contour?.counts ?? {},
    contourShuffled: contour?.shuffled === true,
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
    // A local copy saved before a collection or a `meta` document existed lacks it: the matching
    // migration screen shows up (or a "Synchroniser" fetches it).
    cache = {
      ...snapshot.cache,
      contours: snapshot.cache.contours ?? {},
      compassCounts: snapshot.cache.compassCounts ?? {},
      compassShuffled: snapshot.cache.compassShuffled ?? false,
      cluesCounts: snapshot.cache.cluesCounts ?? {},
      cluesShuffled: snapshot.cache.cluesShuffled ?? false,
      contourCounts: snapshot.cache.contourCounts ?? {},
      contourShuffled: snapshot.cache.contourShuffled ?? false,
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
 * atomic; the data version is bumped in the last one. `onProgress(done, total)` after each batch. */
const commitInBatches = async (
  operations: ((batch: WriteBatch) => void)[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> => {
  for (let start = 0; start < operations.length || start === 0; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = operations.slice(start, start + BATCH_SIZE);
    for (const operation of chunk) operation(batch);
    if (start + BATCH_SIZE >= operations.length) {
      batch.set(doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id), versionBump, { merge: true });
    }
    await batch.commit();
    onProgress?.(Math.min(start + BATCH_SIZE, operations.length), operations.length);
  }
};

// --- Compass numbering ---------------------------------------------------------------------------------

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
  await commitInBatches(
    [
      ...changed.map(
        ([key, n]) =>
          (batch: WriteBatch) =>
            batch.set(doc(db, COLLECTIONS.places, key), { n }, { merge: true }),
      ),
      (batch) =>
        batch.set(doc(db, COMPASS_COUNTS_DOC.collection, COMPASS_COUNTS_DOC.id), {
          counts,
          shuffled: true,
        } satisfies CompassCountsDoc),
    ],
    onProgress,
  );
  for (const [key, n] of changed) data().places[key].n = n;
  data().compassCounts = counts;
  data().compassShuffled = true;
  persist();
};

// --- Country copied into the places ----------------------------------------------------------------------

/** Places whose copy of their country (`PlaceDoc.country`) is missing or out of date. */
export const placesMissingCountry = (): string[] => placesNeedingCountry(data().places, data().countries);

/** One-off: copies each country into its places (`update` replaces the whole `country` map). */
export const copyCountryIntoPlaces = async (onProgress: (done: number, total: number) => void): Promise<void> => {
  const keys = placesMissingCountry();
  await commitInBatches(
    keys.map(
      (key) => (batch: WriteBatch) =>
        batch.update(doc(db, COLLECTIONS.places, key), {
          country: countrySnapshot(data().countries[data().places[key].code]),
        }),
    ),
    onProgress,
  );
  for (const key of keys) data().places[key].country = countrySnapshot(data().countries[data().places[key].code]);
  persist();
};

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

// --- Riddles and job labels copied into the places ---------------------------------------------------------

/** Places whose copies of the riddles (`clues.riddles`) or of their personality's job label are missing or out of date. */
export const placesMissingClueCopies = (): string[] =>
  placesNeedingClueCopies(data().places, data().riddles, data().jobs);

/** One-off: copies the riddle of each syllable and the job label into the places that lack them. */
export const copyClueDataIntoPlaces = async (onProgress: (done: number, total: number) => void): Promise<void> => {
  const keys = placesMissingClueCopies();
  const next = Object.fromEntries(
    keys.map((key) => [key, withJobLabel(withRiddles(data().places[key], data().riddles), data().jobs)]),
  );
  await commitInBatches(
    keys.map((key) => (batch: WriteBatch) => batch.set(doc(db, COLLECTIONS.places, key), next[key])),
    onProgress,
  );
  Object.assign(data().places, next);
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

// --- Clues numbering ---------------------------------------------------------------------------------------

/** True while a Clues place lacks its `clues.category`/`clues.n`, or `meta/cluesCounts` is out of sync. */
export const cluesNumberingBroken = (): boolean =>
  !isNumberingConsistent(data().places, data().cluesCounts, CLUES_NUMBERING) ||
  Object.values(data().places).some((place) => place.clues && place.clues.category !== cluesCategory(place));

/** Broken, or numbered in the import order: the game's cursor draw needs the shuffled one. */
export const cluesNumberingPending = (): boolean => cluesNumberingBroken() || !data().cluesShuffled;

/** One-off: gives every Clues place its category and its shuffled position, writes `meta/cluesCounts`. */
export const numberCluesPlaces = async (onProgress: (done: number, total: number) => void): Promise<void> => {
  const { numbers, counts } = computeNumbering(Object.entries(data().places), {
    force: true,
    numbering: CLUES_NUMBERING,
  });
  const entries = Object.entries(numbers);
  await commitInBatches(
    [
      ...entries.map(
        ([key, n]) =>
          (batch: WriteBatch) =>
            batch.update(doc(db, COLLECTIONS.places, key), {
              'clues.category': cluesCategory(data().places[key]),
              'clues.n': n,
            }),
      ),
      (batch) =>
        batch.set(doc(db, CLUES_COUNTS_DOC.collection, CLUES_COUNTS_DOC.id), {
          counts,
          shuffled: true,
        } satisfies CluesCountsDoc),
    ],
    onProgress,
  );
  for (const [key, n] of entries) {
    const place = data().places[key];
    place.clues = { ...place.clues!, category: cluesCategory(place), n };
  }
  data().cluesCounts = counts;
  data().cluesShuffled = true;
  persist();
};

// --- Contours (silhouettes) ---------------------------------------------------------------------------------

/** True while some country still embeds its silhouette, or `contours` / `meta/contourCounts` are out of sync. */
export const contourMigrationPending = (): boolean =>
  Object.values(data().countries).some((country) => country.contour) ||
  !isContourNumberingConsistent(data().contours, data().contourCounts) ||
  !data().contourShuffled;

/**
 * One-off: builds `contours/{code}` from the silhouettes embedded in the countries (names copied in, capital
 * and cities precomputed from the places, shuffled numbering per difficulty), writes them with
 * `meta/contourCounts`, and only then removes the embedded `contour` from the countries — so an interrupted
 * run can simply be started again.
 */
export const migrateContours = async (onProgress: (done: number, total: number) => void): Promise<void> => {
  const embedded = Object.entries(data().countries).filter(([, country]) => country.contour);
  const built = buildContourDocs(data().countries, Object.values(data().places)).docs;
  const merged: Record<string, ContourCountryDoc> = { ...data().contours, ...built };
  const { numbers, counts } = computeContourNumbering(Object.entries(merged), { force: true });
  for (const [code, n] of Object.entries(numbers)) merged[code] = { ...merged[code], n };

  await commitInBatches(
    [
      ...Object.entries(merged).map(
        ([code, contour]) =>
          (batch: WriteBatch) =>
            batch.set(doc(db, COLLECTIONS.contours, code), contour),
      ),
      (batch) =>
        batch.set(doc(db, CONTOUR_COUNTS_DOC.collection, CONTOUR_COUNTS_DOC.id), {
          counts,
          shuffled: true,
        } satisfies ContourCountsDoc),
      ...embedded.map(
        ([code]) =>
          (batch: WriteBatch) =>
            batch.update(doc(db, COLLECTIONS.countries, code), { contour: deleteField() }),
      ),
    ],
    onProgress,
  );
  data().contours = merged;
  for (const [code] of embedded) delete data().countries[code].contour;
  data().contourCounts = counts;
  data().contourShuffled = true;
  contoursMemo = null;
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
