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
import { planJobChange } from '@/data/firestore/denormalizeClues';
import {
  CLUES_NUMBERING,
  cluesCategory,
  COMPASS_NUMBERING,
  planRegroup,
} from '@/data/firestore/numbering';
import {
  CLUES_COUNTS_DOC,
  COLLECTIONS,
  COMPASS_COUNTS_DOC,
  DATA_VERSION_DOC,
  JOURNAL_COLLECTION,
  type CluesCountsDoc,
  type CompassCounts,
  type CompassCountsDoc,
  type CountryDoc,
  type JobDoc,
  type JournalChange,
  type JournalDoc,
  type PlaceDoc,
} from '@/data/firestore/types';
import { db } from './firebase';
import { readSnapshot, writeSnapshot } from './snapshotStore';

/**
 * Copie admin des donnees du jeu : en memoire pour des lectures synchrones, miroir dans IndexedDB (`snapshotStore`)
 * pour ne lire Firestore qu'au premier chargement ou via "Synchroniser" (`syncData`). Toute ecriture va d'abord a
 * Firestore, qui reste la source de verite.
 */
type Cache = {
  places: Record<string, PlaceDoc>;
  /** Lu avec tolerance : les documents portent encore des champs de Silhouette, ni lus ni retires. */
  countries: Record<string, CountryDoc>;
  jobs: Record<string, JobDoc>;
  /** `meta/compassCounts` : taille de chaque groupe Boussole (voir `numbering.ts`). */
  compassCounts: CompassCounts;
  /** `meta/compassCounts.shuffled` : garde tel quel quand la numerotation est maintenue (voir `applyPlaceChange`). */
  compassShuffled: boolean;
  /** `meta/cluesCounts`, idem pour les groupes Indices. */
  cluesCounts: CompassCounts;
  cluesShuffled: boolean;
};

let cache: Cache | null = null;

const readCollection = async <T>(name: string): Promise<Record<string, T>> => {
  const { docs } = await getDocs(collection(db, name));
  return Object.fromEntries(docs.map((snapshot) => [snapshot.id, snapshot.data() as T]));
};

const readMeta = async <T>({ collection: name, id }: { collection: string; id: string }): Promise<T | undefined> =>
  (await getDoc(doc(db, name, id))).data() as T | undefined;

const fetchAll = async (): Promise<Cache> => {
  const [places, countries, jobs, compass, clues] = await Promise.all([
    readCollection<PlaceDoc>(COLLECTIONS.places),
    readCollection<CountryDoc>(COLLECTIONS.countries),
    readCollection<JobDoc>(COLLECTIONS.personalityJobs),
    readMeta<CompassCountsDoc>(COMPASS_COUNTS_DOC),
    readMeta<CluesCountsDoc>(CLUES_COUNTS_DOC),
  ]);
  return {
    places,
    countries,
    jobs,
    compassCounts: compass?.counts ?? {},
    compassShuffled: compass?.shuffled === true,
    cluesCounts: clues?.counts ?? {},
    cluesShuffled: clues?.shuffled === true,
  };
};

/**
 * `journalAt` : ms de la derniere entree du journal deja dans la copie (`null` : inconnu, seule une synchro complete
 * convient).
 */
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

const newestJournalAt = async (): Promise<number> => {
  const { docs } = await getDocs(query(collection(db, JOURNAL_COLLECTION), orderBy('at', 'desc'), limit(1)));
  return docs.length === 0 ? 0 : (docs[0].data().at as Timestamp).toMillis();
};

/**
 * Lit tout Firestore (~2,8k lectures) et remplace la copie. La derniere entree du journal est lue AVANT les donnees :
 * une ecriture entre-temps est dans la copie ET revue par la synchro incrementale (sans effet), jamais ratee.
 */
const syncData = async (): Promise<void> => {
  const newest = await newestJournalAt();
  cache = await fetchAll();
  syncedAt = Date.now();
  journalAt = newest;
  await writeSnapshot({ cache, syncedAt, journalAt } satisfies Snapshot);
};

/** Au-dela, une lecture complete coute autant : l'ecouteur du journal s'y rabat. */
const MAX_INCREMENTAL = 1000;

/** Entrees du journal en cours de traitement, l'une apres l'autre. */
let queue: Promise<void> = Promise.resolve();

/** Entrees ecrites par cet admin (leurs documents sont deja dans la copie). */
const ownEntryIds = new Set<string>();

const newEntryRef = () => {
  const ref = doc(collection(db, JOURNAL_COLLECTION));
  ownEntryIds.add(ref.id);
  return ref;
};

/** Incremente quand un changement d'ailleurs arrive dans la copie (les vues se remontent). */
let revision = 0;
const revisionListeners = new Set<() => void>();

export const subscribeRevision = (listener: () => void): (() => void) => {
  revisionListeners.add(listener);
  return () => revisionListeners.delete(listener);
};

export const dataRevision = (): number => revision;

const notifyRevision = () => {
  revision += 1;
  for (const listener of revisionListeners) listener();
};

/**
 * Relit les documents nommes par `changes` (une suppression n'en demande pas). Un changement sur une collection
 * inconnue (vieille entree) est ignore.
 */
const applyChanges = async (current: Cache, changes: JournalChange[]): Promise<void> => {
  await Promise.all(
    changes
      .filter(({ c }) => c in COLLECTIONS)
      .map(async ({ c, id, op }) => {
        const snapshot = op === 'delete' ? null : await getDoc(doc(db, COLLECTIONS[c], id));
        const value = snapshot?.exists() ? snapshot.data() : undefined;
        if (c === 'places') assign(current.places, id, value as PlaceDoc | undefined);
        else if (c === 'countries') assign(current.countries, id, value as CountryDoc | undefined);
        else if (c === 'personalityJobs') assign(current.jobs, id, value as JobDoc | undefined);
        else if (id === COMPASS_COUNTS_DOC.id) {
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
 * Ecoute le journal (entrees plus recentes que la copie) et ne relit que les documents nommes. Ignore les changements
 * de cet admin ; avertit les vues quand un changement d'ailleurs arrive (`subscribeRevision`). Rend la fonction de
 * desabonnement.
 */
export const startJournalSync = (): (() => void) =>
  onSnapshot(
    query(collection(db, JOURNAL_COLLECTION), where('at', '>', Timestamp.fromMillis(journalAt ?? 0)), orderBy('at')),
    (snapshot) => {
      const added = snapshot.docChanges().filter((change) => change.type === 'added');
      if (added.length === 0) return;
      queue = queue.then(async () => {
        const foreign = added.filter((change) => !ownEntryIds.has(change.doc.id)).map((change) => change.doc);
        const times = added.map((change) => change.doc.data().at as Timestamp | null).filter((at) => at !== null);
        if (foreign.length > 0 && cache) {
          const changes = collapseJournal(foreign.map((entry) => (entry.data() as JournalDoc).changes));
          if (changes.length > MAX_INCREMENTAL) await syncData();
          else await applyChanges(cache, changes);
          notifyRevision();
        }
        if (times.length > 0) journalAt = Math.max(journalAt ?? 0, ...times.map((at) => at.toMillis()));
        syncedAt = Date.now();
        persist();
      });
    },
    (error) => console.error('[journal]', error),
  );

const assign = <T>(record: Record<string, T>, id: string, value: T | undefined): void => {
  if (value === undefined) delete record[id];
  else record[id] = value;
};

/** Copie locale si elle existe (aucune lecture Firestore), sinon une premiere synchro complete. */
export const loadData = async (): Promise<void> => {
  const snapshot = await readSnapshot<Snapshot>();
  if (snapshot) {
    // Une copie d'avant le deplacement des silhouettes dans les pays porte encore la cle `contours` : retiree. Une
    // copie d'avant `countries` n'en a pas : une lecture complete.
    const current: Cache & { contours?: unknown } = { ...snapshot.cache };
    delete current.contours;
    cache = current;
    syncedAt = snapshot.syncedAt;
    journalAt = snapshot.journalAt ?? null;
    // Une copie anterieure au journal n'y a pas de position : une lecture complete, puis le journal prend le relais.
    if (journalAt === null || !current.countries) await syncData();
    return;
  }
  await syncData();
};

/** Donnees chargees ; `AuthGate` ne rend rien qui les lise avant la fin de `loadData`. */
export const data = (): Cache => {
  if (!cache) throw new Error('Données non chargées');
  return cache;
};

/**
 * Ecrit un document (`null` : le supprime) par le meme chemin que toute ecriture : version des donnees et journal
 * inclus.
 */
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

/**
 * Execute `operations` par lots d'au plus `BATCH_SIZE` (plafond Firestore : 500), chaque lot atomique ; version et
 * entree de journal sont ecrites dans le dernier, donc une entree n'est visible qu'une fois toutes ses donnees.
 */
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

// --- Copies tenues a jour avec leur source --------------------------------------------------------------------

/**
 * Ecrit `next` en `countries/{code}` et reecrit, dans les memes lots, chaque copie : le `country` de ses lieux (voir
 * `planCountryChange`). `next` part du document stocke, donc les champs que l'admin ne gere pas sont conserves.
 */
export const applyCountryChange = async (code: string, next: CountryDoc): Promise<void> => {
  const plan = planCountryChange(code, next, data().places);
  await commitInBatches(
    [
      (batch) => batch.set(doc(db, COLLECTIONS.countries, code), next),
      ...Object.entries(plan.places).map(
        ([key, place]) =>
          (batch: WriteBatch) =>
            batch.update(doc(db, COLLECTIONS.places, key), { country: place.country }),
      ),
    ],
    [
      { c: 'countries', id: code, op: 'set' },
      ...Object.keys(plan.places).map((id) => ({ c: 'places' as const, id, op: 'set' as const })),
    ],
  );
  data().countries[code] = next;
  Object.assign(data().places, plan.places);
  persist();
};

/**
 * Ecrit le metier `code` en `personalityJobs/{code}` et recopie son libelle dans chaque personnalite qui l'utilise.
 */
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

// --- Edition des lieux ----------------------------------------------------------------------------------------------

/**
 * Ecrit `next` en `places/{key}` (`null` = supprime) et garde les deux numerotations denses dans le MEME lot (voir
 * `planRegroup`) : le lieu qui quitte un groupe cede son numero au dernier, celui qui arrive passe dernier,
 * `meta/compassCounts` et `meta/cluesCounts` suivent. La categorie Indices derive de la Boussole : changer celle-ci
 * regroupe aussi Indices.
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
