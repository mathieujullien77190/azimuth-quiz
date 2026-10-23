import type { Difficulty } from '@/types';

export type GameHeaderProps = {
  onQuit: () => void;
  /** Code de la room, a cote de la croix de sortie. */
  code: string;
  /** Joueur de cet appareil et son total, en haut a droite ("Zoé · 350 pts"). */
  name: string;
  points: number;
  /** Affiche "Manche 3 / 10 · difficulte", aligne a gauche sous la ligne du haut. */
  roundNumber: number;
  totalRounds: number;
  difficulty: Difficulty;
  /** Mode voyage : ou se trouve le joueur ("Vous êtes à Cusco"), deja traduit ; ligne blanche sous la ligne de manche. */
  location?: string;
};
