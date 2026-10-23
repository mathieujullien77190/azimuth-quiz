import type { Player } from '@/types';

export type PlayerTabsProps = {
  players: Player[];
  /**
   * Ordre d'affichage (index dans `players`). `GameHeader` passe l'identite : l'appelant a deja ordonne `players`
   * (ordre de la manche, voir `playersForRound`).
   */
  order: number[];
  activeIndex: number;
  /** Si fourni, l'onglet actif affiche ce texte (ex. « Tour de Matou ») a la place des initiales. */
  activeLabel?: (name: string) => string;
};
