import type { ReactNode } from 'react';

export type AppTitleProps = {
  /** Ligne sous le titre. */
  tagline: string;
  /** Superpose a l'en-tete, positionne par l'appelant (bouton mascotte de l'accueil). */
  children?: ReactNode;
};
