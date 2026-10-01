/** Fraction of the board's own `Math.min(width, height)` (not a fixed pixel count): the game's
 * board and the admin's own preview canvas are fit to the exact same aspect ratio (both call
 * `boardDimensionsFor(country.points, ...)`) but never the same absolute size — a fixed-pixel
 * padding would then eat a different *proportion* of each. A ratio keeps every canvas' layout
 * (the outline's own margin, and the flag/name center labels projected within it) proportionally
 * identical regardless of absolute size — see callers for `Math.min(width, height) * BOARD_PADDING_RATIO`. */
export const BOARD_PADDING_RATIO = 0.06;
/** Every line of the board — the coast, the borders shared with a neighbor and the neighbors' own dashed lines —
 * has this same width: the neighbors themselves are never stroked on the target's side, so a border is drawn once. */
export const VISIBLE_STROKE_WIDTH = 2;
/** Dash pattern of the neighbors' own lines (dotted line: `dash gap`, in px). */
export const BORDER_DASH = '4 4';
/** Neighbors are a discreet backdrop (the `border` color at this opacity) — the silhouette to
 * guess must stay the only thing that pops. */
export const NEIGHBOR_FILL_OPACITY = 0.45;
export const HINT_LABEL_FONT_SIZE = 11;
/** Font size for a `ContourBoardHintLabel` marked `icon` (a flag) — bigger than plain hint-label
 * text so the icon reads clearly at a glance. */
export const HINT_ICON_FONT_SIZE = 22;
/** Vertical gap (fraction of `Math.min(width, height)`, same reasoning as BOARD_PADDING_RATIO)
 * between a revealed hint's icon and its name stacked just below — used both for a neighbor
 * (icon alone at tier 1, icon+name at tier 2) and the target country's own flag/name (tier 3/4). */
export const HINT_STACK_GAP_RATIO = 0.045;
