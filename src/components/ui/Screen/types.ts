import type { ReactNode } from 'react';

export type ScreenProps = {
  children: ReactNode;
  /** Reste fixe en haut, au-dessus de la zone qui defile (ex. selecteur de joueur). */
  header?: ReactNode;
};
