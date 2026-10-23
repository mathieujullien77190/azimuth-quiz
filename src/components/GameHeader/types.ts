import type { Difficulty, Player } from '@/types';

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
  /** Si donne : montre qui joue et a qui est le tour (`PlayerTabs`, statut seulement). Omis : pas d'onglets,
   * pour un jeu sans tours (Boussole : tout le monde repond en meme temps). */
  players?: Player[];
  /** Index dans `players` de celui qui a le tour ; -1 (defaut) si personne, ex. manche finie. Utile avec `players`. */
  turnIndex?: number;
  /** Mode voyage : ou se trouve le joueur ("Vous êtes à Cusco"), deja traduit ; ligne blanche sous la ligne de manche. */
  location?: string;
};
