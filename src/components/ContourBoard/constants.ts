/** Fraction of the board's own `Math.min(width, height)` (not a fixed pixel count): the game's
 * board and the admin's own preview canvas are fit to the exact same aspect ratio (both call
 * `boardDimensionsFor(country.points, ...)`) but never the same absolute size — a fixed-pixel
 * padding would then eat a different *proportion* of each. A ratio keeps every canvas' layout
 * (the outline's own margin, and the flag/name center labels projected within it) proportionally
 * identical regardless of absolute size — see callers for `Math.min(width, height) * BOARD_PADDING_RATIO`. */
export const BOARD_PADDING_RATIO = 0.06;
export const VISIBLE_STROKE_WIDTH = 3;
export const MARKER_RADIUS = 8;
/** A category icon (capital/mountain/landmark/nature — see ContourGameScreen's `placeEmoji`)
 * replacing the plain truth dot for a place drawn on reveal: sized to read clearly at a glance,
 * bigger than the plain dot it replaces (MARKER_RADIUS's own diameter) without dwarfing the
 * TRUTH_MARKER_RING_RADIUS ring drawn around it. */
export const MARKER_EMOJI_FONT_SIZE = 18;
export const MARKER_LABEL_FONT_SIZE = 11;
/** Horizontal gap between a marker's dot and its name label. */
export const MARKER_LABEL_GAP = 6;
/** Extra open ring drawn around the true city marker on reveal, same idea as EarthSection's
 * ring around the true answer. */
export const TRUTH_MARKER_RING_RADIUS = 13;
/** Thin, dashed guess-to-solution connector line — kept subtle so it reads as a measuring line,
 * not another marker competing with the dots at either end. */
export const CONNECTOR_STROKE_WIDTH = 1.5;
export const CONNECTOR_DASH_PATTERN = '4,4';
/** Font size for a `ContourBoardHintLabel` marked `icon` (a flag or the sea/ocean fish glyph) —
 * bigger than plain hint-label text so the icon reads clearly at a glance. */
export const HINT_ICON_FONT_SIZE = 22;
/** Vertical gap (fraction of `Math.min(width, height)`, same reasoning as BOARD_PADDING_RATIO)
 * between a revealed hint's icon and its name stacked just below — used both for a neighbor
 * (icon alone at tier 1, icon+name at tier 2) and the target country's own flag/name (tier 3/4). */
export const HINT_STACK_GAP_RATIO = 0.045;
