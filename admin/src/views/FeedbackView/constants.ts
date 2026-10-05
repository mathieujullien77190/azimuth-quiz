import type { Difficulty } from '@/types';

/** The difficulties from easiest to hardest: the order votes are listed in. */
export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

/** The most documents one batch deletes (Firestore's own cap). */
export const BATCH_SIZE = 500;
