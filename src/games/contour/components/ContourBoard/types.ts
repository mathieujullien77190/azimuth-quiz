import type { Point2D } from '@/types';

/** A single icon/text label drawn straight on the board, centered on `position` (e.g. a hinted
 * neighbor's flag then its name stacked below — see `ContourNeighbor` — or the target country's
 * own flag/name at its center). */
export type ContourBoardHintLabel = {
  position: Point2D;
  text: string;
  /** `text` is an emoji glyph (a flag) rather than plain name text:
   * renders bigger, and with FLAG_FONT_FAMILY — harmless for a non-flag emoji (browsers fall
   * back automatically), but required for a flag glyph to render as a flag rather than a raw
   * two-letter code on Windows Chromium (see themes/fonts.ts). */
  icon?: boolean;
};

export type ContourBoardProps = {
  width: number;
  height: number;
  /** The country's full outline (closed ring, screen-space): shown as-is, no touch interaction
   * on the shape itself — the board has no interaction at all, it's a pure display. */
  outline: Point2D[];
  /** Countries that touch the target (screen-space rings): filled discreetly behind it, without any
   * stroke of their own — so a border they share with the target is drawn only once, by `borders`. */
  neighborOutlines?: Point2D[][];
  /** Stretches of `outline` to stroke as coast (heavy line). Omitted: the whole `outline` is stroked. */
  coastlines?: Point2D[][];
  /** Stretches of `outline` shared with a neighbor, stroked once (thin line). */
  borders?: Point2D[][];
  /** Directional hint labels (e.g. every revealed neighbor's flag/name, the target country's own
   * flag/name at its center) — see `ContourBoardHintLabel`. */
  hintLabels?: ContourBoardHintLabel[];
};
