import type { Difficulty } from '@/types';

/** Difficultes de la plus facile a la plus dure : ordre d'affichage des votes. */
export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

/** Maximum de documents supprimes par lot (plafond Firestore). */
export const BATCH_SIZE = 500;
