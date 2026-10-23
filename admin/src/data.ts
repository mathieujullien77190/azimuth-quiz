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
} from 'firebase/firestore';

import { collapseJournal } from '@/firebase/journal';
import { NUMBERING, planRegroup } from '@/firebase/numbering';
import { COLLECTIONS, COUNTS_DOC, DATA_VERSION_DOC, JOURNAL_COLLECTION } from '@/firebase/constants';
import {
  type Counts,
  type CountsDoc,
  type JournalChange,
  type JournalDoc,
  type PlaceDoc,
} from '@/firebase/types';
import { db } from './firebase';
import { readSnapshot, writeSnapshot } from './snapshotStore';

/**
 * Copie admin des donnees du jeu : en memoire pour des lectures synchrones, miroir dans IndexedDB (`snapshotStore`)
 * pour ne lire Firestore qu'au premier chargement ou via "Synchroniser" (`syncData`). Toute ecriture va d'abord a
 * Firestore, qui reste la source de verite.
 */
type Cache = {
  places: Record<string, PlaceDoc>;
  /** `meta/compassCounts` : taille de chaque groupe Boussole (voir `numbering.ts`). */
  compassCounts: Counts;
  /** `meta/compassCounts.shuffled` : garde tel quel quand la numerotation est maintenue (voir `applyPlaceChange`). */
  compassShuffled: boolean;
};

let cache: Cache | null = null;

const readCollection = async <T>(name: string): Promise<Record<string, T>> => {
  const { docs } = await getDocs(collection(db, name));
  return Object.fromEntries(docs.map((snapshot) => [snapshot.id, snapshot.data() as T]));
};

const readMeta = async <T>({ collection: name, id }: { collection: string; id: string }): Promise<T | undefined> =>
  (await getDoc(doc(db, name, id))).data() as T | undefined;

const fetchAll = async (): Promise<Cache> => {
  const [places, compass] = await Promise.all([
    readCollection<PlaceDoc>(COLLECTIONS.places),
    readMeta<CountsDoc>(COUNTS_DOC),
  ]);
  return {
    places,
    compassCounts: compass?.counts ?? {},
    compassShuffled: compass?.shuffled === true,
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
        else if (id === COUNTS_DOC.id) {
          current.compassCounts = (value as CountsDoc | undefined)?.counts ?? {};
          current.compassShuffled = (value as CountsDoc | undefined)?.shuffled === true;
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
    // Une ancienne copie porte encore les cles `contours` et `countries` : retirees.
    const current: Cache & { contours?: unknown; countries?: unknown } = { ...snapshot.cache };
    delete current.contours;
    delete current.countries;
    cache = current;
    syncedAt = snapshot.syncedAt;
    journalAt = snapshot.journalAt ?? null;
    // Une copie anterieure au journal n'y a pas de position : une lecture complete, puis le journal prend le relais.
    if (journalAt === null) await syncData();
    return;
  }
  await syncData();
};

/** Donnees chargees ; `AuthGate` ne rend rien qui les lise avant la fin de `loadData`. */
export const data = (): Cache => {
  if (!cache) throw new Error('Données non chargées');
  return cache;
};

const versionBump = { version: increment(1), updatedAt: Date.now() };

// --- Edition des lieux ----------------------------------------------------------------------------------------------

/**
 * Ecrit `next` en `places/{key}` (`null` = supprime) et garde la numerotation dense dans le MEME lot (voir
 * `planRegroup`) : le lieu qui quitte un groupe cede son numero au dernier, celui qui arrive passe dernier et
 * `meta/compassCounts` suit.
 */
export const applyPlaceChange = async (key: string, next: PlaceDoc | null): Promise<void> => {
  const { places, compassCounts } = data();
  const written: PlaceDoc | null = next && { ...next };
  const compass = planRegroup(places, compassCounts, key, written, NUMBERING);
  if (written) {
    if (compass.n === null) delete written.n;
    else written.n = compass.n;
  }
  const batch = writeBatch(db);
  if (written) batch.set(doc(db, COLLECTIONS.places, key), written);
  else batch.delete(doc(db, COLLECTIONS.places, key));
  for (const [otherKey, n] of Object.entries(compass.moved)) batch.update(doc(db, COLLECTIONS.places, otherKey), { n });
  batch.set(doc(db, COUNTS_DOC.collection, COUNTS_DOC.id), {
    counts: compass.counts,
    ...(data().compassShuffled && { shuffled: true as const }),
  } satisfies CountsDoc);
  batch.set(doc(db, DATA_VERSION_DOC.collection, DATA_VERSION_DOC.id), versionBump, { merge: true });
  const changes: JournalChange[] = [
    { c: 'places', id: key, op: written ? 'set' : 'delete' },
    ...Object.keys(compass.moved).map((id) => ({ c: 'places' as const, id, op: 'set' as const })),
    { c: 'meta', id: COUNTS_DOC.id, op: 'set' },
  ];
  batch.set(newEntryRef(), { at: serverTimestamp(), changes });
  await batch.commit();
  if (written) places[key] = written;
  else delete places[key];
  for (const [otherKey, n] of Object.entries(compass.moved)) places[otherKey].n = n;
  data().compassCounts = compass.counts;
  persist();
};
