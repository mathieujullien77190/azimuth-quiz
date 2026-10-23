import { reporting } from '../helpers/errors';
import { doc, getDoc } from 'firebase/firestore';

import type { Counts } from '@/firebase/types';

import { db } from './client';

// Hors du barrel de `helpers/index.ts` : `firebase/firestore` est ESM seul et fait planter Jest.

/**
 * Charge les tailles de groupes (`meta/compassCounts`) : lues une fois et partagees,
 * un echec n'est pas garde. Elles ne changent que si l'admin edite les lieux : relues au lancement suivant.
 */
export const createGroupCounts = <C = Counts>(source: { collection: string; id: string }) => {
  let loading: Promise<C> | null = null;

  const load = (): Promise<C> => {
    loading ??= getDoc(doc(db, source.collection, source.id))
      .then((snapshot) => ((snapshot.data() ?? { counts: {} }) as { counts: C }).counts)
      .catch((error: unknown) => {
        loading = null;
        throw error;
      });
    return loading;
  };

  return {
    load,
    /** Lance la lecture sans l'attendre (lancement) ; un echec est silencieux, le demarrage relit. */
    preload: (): void => {
      load().catch(reporting('draw.preloadCounts', { kind: 'background' }));
    },
    /** Oublie la lecture partagee. */
    clear: (): void => {
      loading = null;
    },
  };
};
