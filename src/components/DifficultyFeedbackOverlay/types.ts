import type { Difficulty } from '@/types';

export type DifficultyFeedbackOverlayProps = {
  /** "Le lieu Paris était-il…", already translated; `null` hides the overlay. */
  question: string | null;
  /** The player's answer: easy, intermediate or hard. */
  onChoose: (difficulty: Difficulty) => void;
  /** A tap beside the answers: nothing is sent, the game goes on. */
  onDismiss: () => void;
};
