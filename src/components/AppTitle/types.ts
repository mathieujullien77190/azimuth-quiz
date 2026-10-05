import type { ReactNode } from 'react';

export type AppTitleProps = {
  /** The line under the title ("Pas de GPS, que de l’instinct."). */
  tagline: string;
  /** Laid over the header, positioned by the caller (the home screen's mascot button, fixed at the top right). */
  children?: ReactNode;
};
