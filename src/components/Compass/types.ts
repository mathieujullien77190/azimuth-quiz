import type { Theme } from '@/types';

export type CompassProps = {
  size: number;
  /** Every needle to draw, drawn identically — Compass no longer distinguishes "my own" from
   * anyone else's; a caller wanting one to stand out (e.g. the player currently dragging it)
   * just includes it here like any other. Omit an entry entirely for "not answered yet" rather
   * than a null bearing. */
  needles?: CompassNeedle[];
  /** True heading, shown on reveal. */
  truthBearing?: number | null;
  /** On mobile: the dial rotates so N points to true north (phone sensor). */
  live?: boolean;
  /** Absent = decorative, non-interactive compass. */
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
  /** Call on the compass's first touch: on web, kicks off listening to the sensor
   * (and, on iOS, the permission request, which requires a user gesture). No effect elsewhere. */
  onTouch: () => void;
};

/** Browser orientation event, plus Safari iOS's non-standard field. */
export type WebOrientationEvent = DeviceOrientationEvent & {
  /** Safari iOS only: already-absolute heading (true north), in degrees. */
  webkitCompassHeading?: number;
};
