import type { Point2D } from '@/types';

/** A straight dashed segment between two points (e.g. a player's city guess and that place's
 * true solution) — purely visual, no animation, always in a neutral muted stroke. */
export type ContourBoardConnector = {
  from: Point2D;
  to: Point2D;
  /** Defaults to a neutral muted stroke (see ContourBoard's own default) when omitted — set per
   * place (CONTOUR_PLACE_LINE_COLORS) so several places' connectors stay visually distinguishable
   * on the same board. */
  color?: string;
};

/** A single icon/text label drawn straight on the board, centered on `position` (e.g. a hinted
 * neighbor's flag then its name stacked below — see `ContourNeighbor` — or the target country's
 * own flag/name at its center). */
export type ContourBoardHintLabel = {
  position: Point2D;
  text: string;
  /** `text` is an emoji glyph (a flag or the sea/ocean fish icon) rather than plain name text:
   * renders bigger, and with FLAG_FONT_FAMILY — harmless for a non-flag emoji (browsers fall
   * back automatically), but required for a flag glyph to render as a flag rather than a raw
   * two-letter code on Windows Chromium (see themes/fonts.ts). */
  icon?: boolean;
};

export type ContourBoardMarker = {
  position: Point2D;
  color: string;
  /** Extra open ring around the marker instead of a plain filled dot: the true city, shown on reveal. */
  isTruth?: boolean;
  /** Name shown next to the marker (e.g. the true place's name) — omit for markers that don't
   * need one (player guesses). */
  label?: string;
  /** A category icon (see ContourGameScreen's `placeEmoji`) drawn instead of the plain filled dot
   * — only ever set on a truth marker, never a player guess. `color` still drives its ring. */
  emoji?: string;
};

export type ContourBoardProps = {
  width: number;
  height: number;
  /** The country's full outline (closed ring, screen-space): shown as-is, no touch interaction
   * on the shape itself. */
  outline: Point2D[];
  /** Fixed markers on top of everything else: the true city and submitted players' city guesses
   * (reveal). */
  markers?: ContourBoardMarker[];
  /** Dashed guess-to-solution lines, rendered under `markers` so the dots stay on top — a quick
   * visual read of each player's error distance. */
  connectors?: ContourBoardConnector[];
  /** Directional hint labels (e.g. every revealed neighbor's flag/name, the target country's own
   * flag/name at its center) — see `ContourBoardHintLabel`. */
  hintLabels?: ContourBoardHintLabel[];
  /** The active player's in-progress city marker (controlled: the board only renders it,
   * `onPlacePoint` reports the new position back to the caller). */
  placedPoint?: Point2D;
  activeMarkerColor?: string;
  /** Presence puts the board in point-placing mode (touch-editable, the city phase's only
   * interaction): called with the touch position on every touch grant/move, so dragging before
   * lifting the finger fine-tunes the marker. */
  onPlacePoint?: (point: Point2D) => void;
};
