import type { Point2D } from '@/types';

export type ContourBoardTrace = {
  points: Point2D[];
  color: string;
  /** Renders on top of everything else: a hole's true arc. Each `isTruth` trace plays its own
   * "drawn by a pen" reveal animation once, the first render it appears in (see ContourBoard's
   * own doc comment) — so holes revealed at different times animate independently. */
  isTruth?: boolean;
  /** Stable React key for an `isTruth` trace (e.g. its hole index) — also identifies which
   * `Animated.Value` drives its reveal, so it must stay the same across renders for that hole. */
  key?: string | number;
};

/** A straight dashed segment between two points (e.g. a player's city guess and that place's
 * true solution) — purely visual, no animation, always in a neutral muted stroke. */
export type ContourBoardConnector = {
  from: Point2D;
  to: Point2D;
};

export type ContourBoardMarker = {
  position: Point2D;
  color: string;
  /** Extra open ring around the marker instead of a plain filled dot: the true city, shown on reveal. */
  isTruth?: boolean;
  /** Name shown next to the marker (e.g. the true place's name) — omit for markers that don't
   * need one (player guesses). */
  label?: string;
};

/** Plain dot at a still-unclaimed hole's location: a passive location hint (not a tap target —
 * the target hole is inferred from where the player draws, see ContourGameScreen's
 * `nearestUnclaimedHole`). */
export type ContourBoardHoleMarker = {
  position: Point2D;
};

export type ContourBoardProps = {
  width: number;
  height: number;
  /** Fixed arcs, always shown — several with holes in between (one per player), a single one
   * covering almost the whole ring in solo. */
  visible: Point2D[][];
  /** Dots marking specific points (e.g. every still-unclaimed hole's two anchors, while players
   * are drawing): the caller decides which points are worth marking, the board just renders them. */
  anchors?: Point2D[];
  /** Location dots (see ContourBoardHoleMarker) for still-unclaimed holes. */
  holeMarkers?: ContourBoardHoleMarker[];
  /** Extra strokes on top of `visible`: claimed holes' true arcs (`isTruth`, each one revealed
   * the first render it appears in) and any other colored traces the caller wants to show. */
  traces?: ContourBoardTrace[];
  /** Fixed markers on top of everything else: the true city and submitted players' city guesses
   * (reveal). */
  markers?: ContourBoardMarker[];
  /** Dashed guess-to-solution lines, rendered under `markers` so the dots stay on top — a quick
   * visual read of each player's error distance. */
  connectors?: ContourBoardConnector[];
  /** The active player's in-progress trace (controlled: the board only renders it, `onDraw`
   * reports new points back to the caller). */
  activePoints?: Point2D[];
  activeColor?: string;
  /** The active player's in-progress city marker (controlled the same way as `activePoints`,
   * via `onPlacePoint`). */
  placedPoint?: Point2D;
  activeMarkerColor?: string;
  /** Presence puts the board in trace-drawing mode (touch-editable, mutually exclusive with
   * `onPlacePoint`): called with the full updated trace on every touch move/grant. */
  onDraw?: (points: Point2D[]) => void;
  /** Presence puts the board in point-placing mode instead (touch-editable, mutually exclusive
   * with `onDraw`): called with the touch position on every grant/move, so dragging before
   * lifting the finger fine-tunes the marker. */
  onPlacePoint?: (point: Point2D) => void;
};
