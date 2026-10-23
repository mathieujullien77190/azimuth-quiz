import type { ReactNode } from 'react';

export type StandingEntry = {
  name: string;
  total: number;
  /** Couleur du joueur : un point avant le nom. */
  color?: string;
};

export type FinalStandingsProps = {
  /** Titre de l'ecran ("Classement final"). */
  title: string;
  /** Total final de chaque joueur, dans le desordre : classes ici, meilleur d'abord. */
  entries: StandingEntry[];
  /** Nom du joueur de cet appareil (unique dans une room) : la banniere dit "Vous gagnez !" au lieu de le nommer.
   * Omis (ex. exemple sans nom dans Storybook) : nomme toujours le vainqueur. */
  localName?: string;
  /** Ce que le jeu ajoute sous les scores (carte de rang et recap manche par manche de Boussole...). */
  children?: ReactNode;
  /** "Rejouer" : retour au salon avec tous les joueurs restes dans la room. */
  onReplay: () => void;
  /** "Quitter" : quitte la partie, vers l'accueil. */
  onQuit: () => void;
};

export type RankedEntry = StandingEntry & {
  /** 1 = premier ; les ex aequo partagent le meme rang. */
  rank: number;
};
