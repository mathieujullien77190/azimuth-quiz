import type { Difficulty } from '@/types';

/** One opinion of the `devFeedback` collection (written by the game in dev mode, see `src/helpers/devFeedback.ts`). */
export type FeedbackRow = {
  id: string;
  game: 'compass' | 'clues' | 'silhouette';
  targetType: 'place' | 'country';
  /** The place's key (`places/{key}`) or the country's ISO code. */
  targetKey: string;
  name: string;
  /** What the data said when the opinion was given. */
  currentDifficulty: Difficulty;
  suggestedDifficulty: Difficulty;
  /** ms since epoch. */
  at: number;
};

/** The opinions about one place or country, counted per suggested difficulty. */
export type FeedbackTarget = {
  targetType: 'place' | 'country';
  targetKey: string;
  name: string;
  /** The difficulty the newest opinion saw in the data. */
  currentDifficulty: Difficulty;
  votes: Record<Difficulty, number>;
  total: number;
  /** The most voted difficulties: one, or several on a tie. */
  winners: Difficulty[];
};
