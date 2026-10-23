import type { Theme } from '@/types';

export type CompassProps = {
  size: number;
  /** Toutes les aiguilles, dessinees pareil ; omettre une entree pour "pas encore repondu" plutot qu'un cap null. */
  needles?: CompassNeedle[];
  /** Vrai cap, montre a la revelation. */
  truthBearing?: number | null;
  /** Absent = boussole decorative, non interactive. */
  onChange?: (bearing: number) => void;
};

export type Point = {
  x: number;
  y: number;
};

export type Tick = {
  key: string;
  from: Point;
  to: Point;
  kind: 'cardinal' | 'intercardinal' | 'minor';
};

export type CompassNeedle = {
  bearing: number;
  color: string;
};

export type CompassDialProps = {
  size: number;
  needles: CompassNeedle[];
  truthBearing: number | null;
};

export type CompassFaceProps = {
  size: number;
  colors: Theme['colors'];
  typography: Theme['typography'];
  westLabel: string;
};
