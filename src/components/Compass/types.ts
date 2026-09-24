export type CompassProps = {
  size: number;
  /** Heading chosen by the player (null = not chosen yet). */
  bearing: number | null;
  /** Color of the player's needle (default: design accent). */
  color?: string;
  /** Extra needles (other players' answers on reveal). */
  extraNeedles?: CompassNeedle[];
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
  bearing: number | null;
  color?: string;
  extraNeedles: CompassNeedle[];
  truthBearing: number | null;
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
