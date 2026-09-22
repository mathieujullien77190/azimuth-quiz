import type { ReactNode } from 'react';

export type ScreenProps = {
  children: ReactNode;
  /** Reste fixe en haut, au-dessus de la zone qui defile (ex. selecteur de joueur). */
  header?: ReactNode;
  /** Reste fixe en bas, sous la zone qui defile (ex. bouton d'action principal). */
  footer?: ReactNode;
};
