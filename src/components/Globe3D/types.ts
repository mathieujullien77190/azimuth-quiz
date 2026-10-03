import type { DirectionalLight, Mesh, Scene } from 'three';

import type { EarthMark } from '@/components/EarthSection';
import type { Coordinates } from '@/types';

export type Globe3DProps = {
  /** Side of the (square) drawing: the globe fills it. */
  size: number;
  /** The starting point: every answer is a bearing and a distance from here. */
  origin: Coordinates;
  /** The same answers as the Earth seen from the side: each one is drawn as its constant-heading route (rhumb line),
   * the true one (`isTruth`) only as its circled end point. */
  marks: EarthMark[];
  /** Draws the land (the world's outline). Without it the globe is a bare ball, which the equator and the Greenwich
   * meridian can still mark. Defaults to true. */
  land?: boolean;
  /** Marks the north pole with a dot and an "N" next to it while it is in front, so the player can see how the globe is
   * tilted as it turns. Defaults to true. */
  north?: boolean;
  /** Draws the equator (dashed) so that the player can read where the answer is. */
  equator?: boolean;
  /** Draws the Greenwich meridian (dashed). */
  greenwich?: boolean;
  /** A satellite (at night only, and only unzoomed) flying round the Earth along the route, tappable for a joke.
   * Defaults to true. */
  satellite?: boolean;
  /** Turns with a finger, and zooms by pinching. Defaults to true; false keeps the globe where it was first shown. */
  draggable?: boolean;
  /** The zoom and "back to north" buttons, in the corners of the drawing. Defaults to `draggable`: a globe nobody can
   * turn has nothing to put back either. */
  controls?: boolean;
  /** What shows around the ball. The drawing is a real OpenGL surface, which cannot be see-through on every device: it
   * is painted with this instead of letting what is behind show. Defaults to the theme's background. */
  backgroundColor?: string;
};

/** The colors the scene is built with, taken from the theme by the component. */
export type GlobeColors = {
  globe: string;
  land: string;
  guide: string;
  origin: string;
  pole: string;
};

export type GlobeSceneInput = {
  origin: Coordinates;
  marks: EarthMark[];
  land: boolean;
  equator: boolean;
  greenwich: boolean;
  north: boolean;
  colors: GlobeColors;
};

/** A built scene, the lamp the caller hangs on the camera, and the dots it shrinks back to their screen size when
 * the globe is zoomed in (see `buildGlobeScene`). */
export type GlobeScene = {
  scene: Scene;
  headlight: DirectionalLight;
  screenSized: Mesh[];
};

/** The fingers on the drawing at one moment: where the one that moved is, and how far apart two of them are
 * (`null` with a single finger down, so there is nothing to pinch). */
export type Fingers = {
  x: number;
  y: number;
  gap: number | null;
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
