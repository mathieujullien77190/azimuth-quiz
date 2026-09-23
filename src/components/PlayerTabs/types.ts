import type { Player } from '@/types';

export type PlayerTabsProps = {
  players: Player[];
  /** Ordre d'affichage des onglets (indices dans `players`) : tire au sort a chaque manche. */
  order: number[];
  activeIndex: number;
  /** Reponse deja validee, par index de joueur. */
  answered: boolean[];
  /** Si faux, un onglet deja valide ne s'ouvre pas au second passage. */
  allowRevision: boolean;
  onSelect: (index: number) => void;
  /** Fourni : l'onglet actif affiche ce texte (ex. "A Matou de jouer") au lieu des initiales.
   * Les autres onglets restent compacts (initiales) dans tous les cas. */
  activeLabel?: (name: string) => string;
};
