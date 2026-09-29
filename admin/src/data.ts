import { collection, deleteDoc, doc, getDocs, increment, setDoc } from 'firebase/firestore';

import { unflattenPoints } from '@/data/firestore/build';
import { COLLECTIONS, DATA_VERSION_DOC, type CountryDoc, type JobDoc, type PlaceDoc } from '@/data/firestore/types';
import type { ContourCountry } from '@/types';

import { db } from './firebase';

/**
 * The admin's in-memory copy of the game data, loaded once after sign-in (`AuthGate` -> `loadData`)
 * so views and api helpers can read it synchronously. Every write goes to Firestore first, then
 * updates this copy — the source of truth is Firestore. The whole thing is ~2.6k small documents.
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

export const loadData = async (): Promise<void> => {
  const [places, countries, riddles, jobs] = await Promise.all([
    readCollection<PlaceDoc>(COLLECTIONS.places),
    readCollection<CountryDoc>(COLLECTIONS.countries),
    readCollection<{ riddle: string | null }>(COLLECTIONS.charadeRiddles),
    readCollection<JobDoc>(COLLECTIONS.personalityJobs),
  ]);
  cache = {
    places,
    countries,
    riddles: Object.fromEntries(Object.entries(riddles).map(([syllable, { riddle }]) => [syllable, riddle])),
    jobs,
  };
  contoursMemo = null;
};

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
  await bumpVersion();
};

export const removePlace = async (key: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.places, key));
  delete data().places[key];
  await bumpVersion();
};

export const putCountry = async (code: string, value: CountryDoc): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.countries, code), value);
  data().countries[code] = value;
  contoursMemo = null;
  await bumpVersion();
};

export const putRiddle = async (syllable: string, riddle: string | null): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.charadeRiddles, syllable), { riddle });
  data().riddles[syllable] = riddle;
  await bumpVersion();
};

export const putJob = async (code: string, value: JobDoc): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.personalityJobs, code), value);
  data().jobs[code] = value;
  await bumpVersion();
};

export const removeJob = async (code: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.personalityJobs, code));
  delete data().jobs[code];
  await bumpVersion();
};
