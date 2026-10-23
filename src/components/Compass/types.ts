import type { Theme } from '@/types';

export type CompassProps = {
  size: number;
  /** Toutes les aiguilles, dessinees pareil ; omettre une entree pour "pas encore repondu" plutot qu'un cap null. */
  needles?: CompassNeedle[];
  /** Vrai cap, montre a la revelation. */
  truthBearing?: number | null;
  /** Mobile : le cadran tourne pour que N pointe au vrai nord (capteur). */
  live?: boolean;
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

export type UseHeadingResult = {
  heading: number | null;
  /** A appeler au 1er toucher : sur le web, demarre l'ecoute du capteur (et la permission iOS, qui exige un geste). */
  onTouch: () => void;
};

/** Evenement d'orientation du navigateur, plus le champ non standard de Safari iOS. */
export type WebOrientationEvent = DeviceOrientationEvent & {
  /** Safari iOS seulement : cap deja absolu (vrai nord), en degres. */
  webkitCompassHeading?: number;
};
