import type { Difficulty } from '@/types';

export type DifficultyFeedbackOverlayProps = {
  /** "Le lieu Paris était-il…", deja traduit ; `null` masque l'overlay. */
  question: string | null;
  /** Reponse du joueur : facile, moyen ou difficile. */
  onChoose: (difficulty: Difficulty) => void;
  /** Tap a cote des reponses : rien n'est envoye, le jeu continue. */
  onDismiss: () => void;
};
