import type { EarthMark } from '@/components/EarthSection';
import type { Coordinates } from '@/types';

export type Globe3DProps = {
  /** Side of the (square) drawing: the globe fills it. */
  size: number;
  /** The starting point: every answer is a bearing and a distance from here. */
  origin: Coordinates;
  /** The same answers as the Earth seen from the side: each one is drawn as its great-circle route, the true one
   * (`isTruth`) only as its circled end point. */
  marks: EarthMark[];
  /** Draws the land (the world's outline). Without it the globe is a bare ball, which the equator and the Greenwich
   * meridian can still mark. Defaults to true. */
  land?: boolean;
  /** Draws the equator (dashed) so that the player can read where the answer is. */
  equator?: boolean;
  /** Draws the Greenwich meridian (dashed). */
  greenwich?: boolean;
};

/** A point of the globe seen from the viewer: `x` to the right, `y` up, `z` towards the viewer (< 0 = far side). */
export type ViewPoint = {
  x: number;
  y: number;
  z: number;
};

/** A point on the drawing; `visible` is false on the far side of the globe, where it is pushed back to the outline. */
export type ScreenPoint = {
  x: number;
  y: number;
  visible: boolean;
};
