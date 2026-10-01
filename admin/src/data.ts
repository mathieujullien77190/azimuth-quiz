import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore';

import { collapseJournal } from '@/data/firestore/journal';
import { planCountryChange } from '@/data/firestore/denormalize';
import { planJobChange, planRiddleChange, planSyllableRemoval } from '@/data/firestore/denormalizeClues';
import {
  CLUES_NUMBERING,
  cluesCategory,
  COMPASS_NUMBERING,
  planContourDifficultyChange,
  planRegroup,
} from '@/data/firestore/numbering';
import { contourFromDoc, hasSilhouette } from '@/data/firestore/read';
import { normalizeSyllable } from '@/data/firestore/riddles';
import {
  CLUES_COUNTS_DOC,
  COLLECTIONS,
  COMPASS_COUNTS_DOC,
  CONTOUR_COUNTS_DOC,
  DATA_VERSION_DOC,
  JOURNAL_COLLECTION,
  type CluesCountsDoc,
  type CompassCounts,
  type CompassCountsDoc,
  type ContourCountsDoc,
  type CountryDoc,
  type JobDoc,
  type JournalChange,
  type JournalDoc,
  type PlaceDoc,
} from '@/data/firestore/types';
import type { ContourCountry, Difficulty } from '@/types';

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
  return Object.fromEntries(docs.map((snapshot) => [snapshot.id, snapshot.data() as T]));
};

const readMeta = async <T>({ collection: name, id }: { collection: string; id: string }): Promise<T | undefined> =>
  (await getDoc(doc(db, name, id))).data() as T | undefined;

const fetchAll = async (): Promise<Cache> => {
  const [places, countries, riddles, jobs, compass, clues] = await Promise.all([
    readCollection<PlaceDoc>(COLLECTIONS.places),
    readCollection<CountryDoc>(COLLECTIONS.countries),
    readCollection<{ riddle: string | null }>(COLLECTIONS.charadeRiddles),
    readCollection<JobDoc>(COLLECTIONS.personalityJobs),
    readMeta<CompassCountsDoc>(COMPASS_COUNTS_DOC),
    readMeta<CluesCountsDoc>(CLUES_COUNTS_DOC),
  ]);
  return {
    places,
    countries,
    riddles: Object.fromEntries(Object.entries(riddles).map(([syllable, { riddle }]) => [syllable, riddle])),
    jobs,
    compassCounts: compass?.counts ?? {},
    compassShuffled: compass?.shuffled === true,
    cluesCounts: clues?.counts ?? {},
    cluesShuffled: clues?.shuffled === true,
  };
};

/** `journalAt`: ms of the newest journal entry the copy already includes (`null`: unknown, only a full sync fits). */
type Snapshot = { cache: Cache; syncedAt: number; journalAt?: number | null };

let syncedAt = 0;
let journalAt: number | null = null;
let persistTimer: ReturnType<typeof setTimeout> | undefined;

const persist = () => {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (cache) void writeSnapshot({ cache, syncedAt, journalAt } satisfies Snapshot);
  }, 300);
};

/** Newest journal entry's time (ms), 0 when the journal is empty. */
const newestJournalAt = async (): Promise<number> => {
  const { docs } = await getDocs(query(collection(db, JOURNAL_COLLECTION), orderBy('at', 'desc'), limit(1)));
  return docs.length === 0 ? 0 : (docs[0].data().at as Timestamp).toMillis();
};

/** Reads Firestore in full (~2.8k reads) and replaces the local copy. The journal's newest entry is read BEFORE
 * the data: a write landing meanwhile is then in the copy AND seen again by the next incremental sync (harmless),
 * never missed. */
const syncData = async (): Promise<void> => {
  const newest = await newestJournalAt();
  cache = await fetchAll();
  syncedAt = Date.now();
  journalAt = newest;
  contoursMemo = null;
  await writeSnapshot({ cache, syncedAt, journalAt } satisfies Snapshot);
};

/** More changed documents than this and a full read is about as cheap: the journal listener falls back to it. */
const MAX_INCREMENTAL = 1000;

/** The journal entries being handled, one after the other. */
let queue: Promise<void> = Promise.resolve();

/** Journal entries this admin wrote itself (their documents are already in the local copy). */
const ownEntryIds = new Set<string>();

const newEntryRef = () => {
  const ref = doc(collection(db, JOURNAL_COLLECTION));
  ownEntryIds.add(ref.id);
  return ref;
};

/** Bumped each time a change made by someone else lands in the local copy (views remount on it). */
let revision = 0;
const revisionListeners = new Set<() => void>();

/** For `useSyncExternalStore`. */
export const subscribeRevision = (listener: () => void): (() => void) => {
  revisionListeners.add(listener);
  return () => revisionListeners.delete(listener);
};

export const dataRevision = (): number => revision;

const notifyRevision = () => {
  revision += 1;
  for (const listener of revisionListeners) listener();
};

/** Re-reads the documents `changes` names (a deletion needs no read) and puts them in the local copy. */
const applyChanges = async (current: Cache, changes: JournalChange[]): Promise<void> => {
  await Promise.all(
    changes.map(async ({ c, id, op }) => {
      const snapshot = op === 'delete' ? null : await getDoc(doc(db, COLLECTIONS[c], id));
      const value = snapshot?.exists() ? snapshot.data() : undefined;
      if (c === 'places') assign(current.places, id, value as PlaceDoc | undefined);
      else if (c === 'countries') assign(current.countries, id, value as CountryDoc | undefined);
      else if (c === 'personalityJobs') assign(current.jobs, id, value as JobDoc | undefined);
      else if (c === 'charadeRiddles') {
        assign(current.riddles, id, value === undefined ? undefined : (value as { riddle: string | null }).riddle);
      } else if (id === COMPASS_COUNTS_DOC.id) {
        current.compassCounts = (value as CompassCountsDoc | undefined)?.counts ?? {};
        current.compassShuffled = (value as CompassCountsDoc | undefined)?.shuffled === true;
      } else if (id === CLUES_COUNTS_DOC.id) {
        current.cluesCounts = (value as CluesCountsDoc | undefined)?.counts ?? {};
        current.cluesShuffled = (value as CluesCountsDoc | undefined)?.shuffled === true;
      }
    }),
  );
};

/**
 * Listens to the journal (entries newer than the local copy's position) and keeps the copy up to date: each new
 * entry names the documents somebody changed, only those are re-read. Changes made by this admin are skipped (already
 * in the copy); when something from elsewhere landed, the views are told (`subscribeRevision`). Returns the unsubscribe function.
 */
export const startJournalSync = (): (() => void) =>
  onSnapshot(
    query(collection(db, JOURNAL_COLLECTION), where('at', '>', Timestamp.fromMillis(journalAt ?? 0)), orderBy('at')),
    (snapshot) => {
      const added = snapshot.docChanges().filter((change) => change.type === 'added');
      if (added.length === 0) return;
      // Entries are handled one after the other, in order.
      queue = queue.then(async () => {
        const foreign = added.filter((change) => !ownEntryIds.has(change.doc.id)).map((change) => change.doc);
        const times = added.map((change) => change.doc.data().at as Timestamp | null).filter((at) => at !== null);
        if (foreign.length > 0 && cache) {
          const changes = collapseJournal(foreign.map((entry) => (entry.data() as JournalDoc).changes));
          if (changes.length > MAX_INCREMENTAL) await syncData();
          else await applyChanges(cache, changes);
          contoursMemo = null;
          notifyRevision();
        }
        if (times.length > 0) journalAt = Math.max(journalAt ?? 0, ...times.map((at) => at.toMillis()));
        syncedAt = Date.now();
        persist();
      });
    },
    (error) => console.error('[journal]', error),
  );

/** Sets `record[id]` to `value`, or removes it when there is no document. */
const assign = <T>(record: Record<string, T>, id: string, value: T | undefined): void => {
  if (value === undefined) delete record[id];
  else record[id] = value;
};

/** Local copy if there is one (no Firestore read), else a first full sync. */
export const loadData = async (): Promise<void> => {
  const snapshot = await readSnapshot<Snapshot>();
  if (snapshot) {
    // A copy saved before the silhouettes moved into the countries still carries the old `contours` key: dropped.
    const current: Cache & { contours?: unknown } = { ...snapshot.cache };
    delete current.contours;
    cache = current;
    syncedAt = snapshot.syncedAt;
    journalAt = snapshot.journalAt ?? null;
    contoursMemo = null;
    // A copy older than the journal has no position in it: one full read, then the journal takes over.
    if (journalAt === null) await syncData();
    return;
  }
  await syncData();
};

/** A country's French name from the loaded data (its code when unknown). */
export const countryName = (code: string): string => data().countries[code]?.fr ?? code;

/** The loaded data — `AuthGate` renders nothing that reads it before `loadData` resolved. */
export const data = (): Cache => {
  if (!cache) throw new Error('Données non chargées');
  return cache;
};

/** Every country's silhouette, decoded once (invalidated by any country write). */
export const contours = (): ContourCountry[] => {
  contoursMemo ??= Object.entries(data().countries).flatMap(([code, country]) =>
    hasSilhouette(country) ? [contourFromDoc(code, country)] : [],
  );
  return contoursMemo;
};

/** Writes one document (`null`: deletes it) through the same path as every other write: data version and journal included. */
const putDoc = (collectionName: keyof typeof COLLECTIONS, id: string, value: object | null): Promise<void> =>
  commitInBatches(
    [(batch) => (value ? batch.set(doc(db, collectionName, id), value) : batch.delete(doc(db, collectionName, id)))],
    [{ c: collectionName, id, op: value ? 'set' : 'delete' }],
  );

export const putPlace = async (key: string, value: PlaceDoc): Promise<void> => {
  await putDoc('places', key, value);
  data().places[key] = value;
  persist();
};

/** Rewrites `countries/{code}` (a neighbor moved, the label anchor moved...). */
export const putCountry = async (code: string, value: CountryDoc): Promise<void> => {
  await putDoc('countries', code, value);
  data().countries[code] = value;
  contoursMemo = null;
  persist();
};

export const putRiddle = async (syllable: string, riddle: string | null): Promise<void> => {
  await putDoc('charadeRiddles', syllable, { riddle });
  data().riddles[syllable] = riddle;
  persist();
};

export const putJob = async (code: string, value: JobDoc): Promise<void> => {
  await putDoc('personalityJobs', code, value);
  data().jobs[code] = value;
  persist();
};

export const removeJob = async (code: string): Promise<void> => {
  await putDoc('personalityJobs', code, null);
  delete data().jobs[code];
  persist();
};

const BATCH_SIZE = 400;

const versionBump = { version: increment(1), updatedAt: Date.now() };

/** Runs `operations` in batches of at most `BATCH_SIZE` (Firestore's cap is 500 per batch), each batch
 * atomic; the data version is bumped and the journal entry listing `changes` written in the last one, so an
 * entry is only ever visible once all the data it names is. */
const commitInBatches = async (
  operations: ((batch: WriteBatch) => void)[],
  changes: JournalChange[],
): Promise<void> => {
  for (let start = 0; start < operations.length || start === 0; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = operations.slice(start, start + BATCH_SIZE);
    for (const operation of chunk) operation(batch);
    if (start + BATCH_SIZE >= operations.length) {
      batch.set(doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id), versionBump, { merge: true });
      batch.set(newEntryRef(), { at: serverTimestamp(), changes } satisfies JournalDoc & { at: unknown });
    }
    await batch.commit();
  }
};

// --- Copies kept in sync with their source --------------------------------------------------------------------

/**
 * Writes `next` as `countries/{code}` and rewrites, in the same run of batches, every copy of it: the
 * country of each of its places and the names in the other countries that cite it as a neighbour (see
 * `planCountryChange`).
 */
export const applyCountryChange = async (code: string, next: CountryDoc): Promise<void> => {
  const plan = planCountryChange(code, next, data().places, data().countries);
  await commitInBatches(
    [
      (batch) => batch.set(doc(db, COLLECTIONS.countries, code), next),
      ...Object.entries(plan.places).map(
        ([key, place]) =>
          (batch: WriteBatch) =>
            batch.update(doc(db, COLLECTIONS.places, key), { country: place.country }),
      ),
      ...Object.entries(plan.countries).map(
        ([otherCode, other]) =>
          (batch: WriteBatch) =>
            batch.set(doc(db, COLLECTIONS.countries, otherCode), other),
      ),
    ],
    [
      { c: 'countries', id: code, op: 'set' },
      ...Object.keys(plan.places).map((id) => ({ c: 'places' as const, id, op: 'set' as const })),
      ...Object.keys(plan.countries).map((id) => ({ c: 'countries' as const, id, op: 'set' as const })),
    ],
  );
  data().countries[code] = next;
  Object.assign(data().places, plan.places);
  Object.assign(data().countries, plan.countries);
  contoursMemo = null;
  persist();
};

/**
 * Changes the Silhouette difficulty of country `code` and keeps the numbering of the difficulty groups dense in the same
 * run (see `planContourDifficultyChange`): the country's own `n`, the country that takes the number it frees, and
 * `meta/contourCounts`. The game draws its countries from those numbers, so a difficulty written alone would leave a hole.
 */
export const applyContourDifficultyChange = async (code: string, difficulty: Difficulty): Promise<void> => {
  const current = data().countries[code];
  if (!current || current.difficulty === difficulty) return;
  const stored = await readMeta<ContourCountsDoc>(CONTOUR_COUNTS_DOC);
  const plan = planContourDifficultyChange(data().countries, stored?.counts ?? {}, code, difficulty);
  const next: CountryDoc = { ...current, difficulty, n: plan.n };
  await commitInBatches(
    [
      (batch) => batch.set(doc(db, COLLECTIONS.countries, code), next),
      ...Object.entries(plan.moved).map(
        ([otherCode, n]) =>
          (batch: WriteBatch) =>
            batch.update(doc(db, COLLECTIONS.countries, otherCode), { n }),
      ),
      (batch) =>
        batch.set(doc(db, CONTOUR_COUNTS_DOC.collection, CONTOUR_COUNTS_DOC.id), {
          counts: plan.counts,
          ...(stored?.shuffled && { shuffled: true as const }),
        } satisfies ContourCountsDoc),
    ],
    [
      { c: 'countries', id: code, op: 'set' },
      ...Object.keys(plan.moved).map((id) => ({ c: 'countries' as const, id, op: 'set' as const })),
      { c: 'meta', id: CONTOUR_COUNTS_DOC.id, op: 'set' },
    ],
  );
  data().countries[code] = next;
  for (const [otherCode, n] of Object.entries(plan.moved)) data().countries[otherCode] = { ...data().countries[otherCode], n };
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
  await commitInBatches(
    [
      (batch) => batch.set(doc(db, COLLECTIONS.charadeRiddles, id), { riddle }),
      ...Object.entries(plan).map(
        ([key, place]) =>
          (batch: WriteBatch) =>
            batch.set(doc(db, COLLECTIONS.places, key), place),
      ),
    ],
    [
      { c: 'charadeRiddles', id, op: 'set' },
      ...Object.keys(plan).map((key) => ({ c: 'places' as const, id: key, op: 'set' as const })),
    ],
  );
  data().riddles[id] = riddle;
  Object.assign(data().places, plan);
  persist();
};

/**
 * Deletes `charadeRiddles/{normalized syllable}` and rewrites, in the same run of batches, every place holding that
 * syllable without it (see `planSyllableRemoval`).
 */
export const applySyllableRemoval = async (syllable: string): Promise<void> => {
  const id = normalizeSyllable(syllable);
  const plan = planSyllableRemoval(syllable, data().places, data().riddles);
  await commitInBatches(
    [
      (batch) => batch.delete(doc(db, COLLECTIONS.charadeRiddles, id)),
      ...Object.entries(plan).map(
        ([key, place]) =>
          (batch: WriteBatch) =>
            batch.set(doc(db, COLLECTIONS.places, key), place),
      ),
    ],
    [
      { c: 'charadeRiddles', id, op: 'delete' },
      ...Object.keys(plan).map((key) => ({ c: 'places' as const, id: key, op: 'set' as const })),
    ],
  );
  delete data().riddles[id];
  Object.assign(data().places, plan);
  persist();
};

/** Writes job `code` as `personalityJobs/{code}` and copies its label into every personality tagged with it. */
export const applyJobChange = async (code: string, job: JobDoc): Promise<void> => {
  const plan = planJobChange(code, job, data().places);
  await commitInBatches(
    [
      (batch) => batch.set(doc(db, COLLECTIONS.personalityJobs, code), job),
      ...Object.entries(plan).map(
        ([key, place]) =>
          (batch: WriteBatch) =>
            batch.set(doc(db, COLLECTIONS.places, key), place),
      ),
    ],
    [
      { c: 'personalityJobs', id: code, op: 'set' },
      ...Object.keys(plan).map((key) => ({ c: 'places' as const, id: key, op: 'set' as const })),
    ],
  );
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
  const changes: JournalChange[] = [
    { c: 'places', id: key, op: written ? 'set' : 'delete' },
    ...[...Object.keys(compass.moved), ...Object.keys(clues.moved)].map((id) => ({
      c: 'places' as const,
      id,
      op: 'set' as const,
    })),
    { c: 'meta', id: COMPASS_COUNTS_DOC.id, op: 'set' },
    { c: 'meta', id: CLUES_COUNTS_DOC.id, op: 'set' },
  ];
  batch.set(newEntryRef(), { at: serverTimestamp(), changes });
  await batch.commit();
  if (written) places[key] = written;
  else delete places[key];
  for (const [otherKey, n] of Object.entries(compass.moved)) places[otherKey].n = n;
  for (const [otherKey, n] of Object.entries(clues.moved)) places[otherKey].clues!.n = n;
  data().compassCounts = compass.counts;
  data().cluesCounts = clues.counts;
  persist();
};
