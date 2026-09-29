import { collection, deleteDoc, doc, getDocs, increment, setDoc } from 'firebase/firestore';

import { unflattenPoints } from '@/data/firestore/build';
import { COLLECTIONS, DATA_VERSION_DOC, type CountryDoc, type JobDoc, type PlaceDoc } from '@/data/firestore/types';
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
};

let cache: Cache | null = null;
let contoursMemo: ContourCountry[] | null = null;

const readCollection = async <T>(name: string): Promise<Record<string, T>> =>
  Object.fromEntries((await getDocs(collection(db, name))).docs.map((snapshot) => [snapshot.id, snapshot.data() as T]));

const fetchAll = async (): Promise<Cache> => {
  const [places, countries, riddles, jobs] = await Promise.all([
    readCollection<PlaceDoc>(COLLECTIONS.places),
    readCollection<CountryDoc>(COLLECTIONS.countries),
    readCollection<{ riddle: string | null }>(COLLECTIONS.charadeRiddles),
    readCollection<JobDoc>(COLLECTIONS.personalityJobs),
  ]);
  return {
    places,
    countries,
    riddles: Object.fromEntries(Object.entries(riddles).map(([syllable, { riddle }]) => [syllable, riddle])),
    jobs,
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
    cache = snapshot.cache;
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
  setDoc(doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id), { version: increment(1), updatedAt: Date.now() }, { merge: true });

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
