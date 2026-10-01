import type { Coordinates } from '@/types';

/** An answer to draw on the Earth, as an arc following the surface. */
export type EarthMark = {
  bearing: number;
  /** Surface distance (arc length). */
  distanceKm: number;
  color: string;
  /** Other players' answers while the current player is answering: faded out. */
  opacity?: number;
  /** True answer: circled, and triggers the zoom. */
  isTruth?: boolean;
};

export type EarthSectionProps = {
  size: number;
  /** The starting point of the answers. When given, the Earth can be switched to a 3D globe
   * (`Globe3D`) where each answer is its great-circle route: without it there is nothing to place on a map. */
  origin?: Coordinates;
  marks: EarthMark[];
  /** Shows the +/- buttons (reveal): starts from the ideal zoom, goes down to 1 (whole Earth). */
  zoomControls?: boolean;
  /** Allows the orbiting satellite at zoom 1 (see further below) independently of the +/- buttons:
   * by default follows `zoomControls` (unchanged Compass behavior), but a caller without
   * zoom buttons (the mini-Earth of the Clues game's "Distance" clue, always "revealed") can
   * enable it explicitly without the buttons. */
  allowSatellite?: boolean;
  /** Forces all marks to the same side (1 = right), instead of the real side of their `bearing`:
   * for the Clues game's "Distance" clue, which must only reveal the distance, not the direction
   * (a fixed side for everyone rather than the true heading avoids giving away the heading for free). */
  forceSide?: Side;
};

export type Point = {
  x: number;
  y: number;
};

/** 1 = right (heading east), -1 = left (heading west). */
export type Side = 1 | -1;
