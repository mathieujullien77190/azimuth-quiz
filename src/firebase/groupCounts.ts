import { doc, getDoc } from 'firebase/firestore';

import { COUNTS_DOC } from '@/firebase/constants';
import type { Counts } from '@/firebase/types';
import { reporting } from '@/helpers/errors';

import { db } from './client';

// Hors du barrel de `helpers/index.ts` : `firebase/firestore` est ESM seul et fait planter Jest.

let loading: Promise<Counts> | null = null;

/**
 * Tailles des groupes de lieux (`meta/compassCounts`, voir `fetchRandomPlaces`) : lues une fois et partagees,
 * un echec n'est pas garde. Elles ne changent que si l'admin edite les lieux : relues au lancement suivant.
 */
export const loadCounts = (): Promise<Counts> => {
  loading ??= getDoc(doc(db, COUNTS_DOC.collection, COUNTS_DOC.id))
    .then((snapshot) => ((snapshot.data() ?? { counts: {} }) as { counts: Counts }).counts)
    .catch((error: unknown) => {
      loading = null;
      throw error;
    });
  return loading;
};

/** Lance la lecture sans l'attendre (lancement) ; un echec est silencieux, le demarrage relit. */
export const preloadCounts = (): void => {
  loadCounts().catch(reporting('draw.preloadCounts', { kind: 'background' }));
};

/** Oublie la lecture partagee. */
export const clearCounts = (): void => {
  loading = null;
};
