import type { Difficulty } from '@/types';

/** Un avis de la collection `devFeedback` (ecrit par le jeu en mode dev, voir `src/firebase/devFeedback.ts`). */
export type FeedbackRow = {
  id: string;
  game: 'compass' | 'clues';
  /** Cle du lieu (`places/{key}`). */
  targetKey: string;
  name: string;
  /** Ce que disaient les donnees au moment de l'avis. */
  currentDifficulty: Difficulty;
  suggestedDifficulty: Difficulty;
  /** ms depuis l'epoch. */
  at: number;
};

/** Avis sur un lieu, comptes par difficulte proposee. */
export type FeedbackTarget = {
  targetKey: string;
  name: string;
  /** Difficulte que le plus recent avis voyait dans les donnees. */
  currentDifficulty: Difficulty;
  votes: Record<Difficulty, number>;
  total: number;
  /** Difficultes les plus votees : une, ou plusieurs en cas d'egalite. */
  winners: Difficulty[];
};
