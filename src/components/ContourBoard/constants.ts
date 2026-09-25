export const BOARD_PADDING = 22;
export const VISIBLE_STROKE_WIDTH = 3;
export const TRACE_STROKE_WIDTH = 4;
export const ANCHOR_RADIUS = 6;
export const MARKER_RADIUS = 8;
export const HOLE_MARKER_RADIUS = 11;
export const MARKER_LABEL_FONT_SIZE = 11;
/** Horizontal gap between a marker's dot and its name label. */
export const MARKER_LABEL_GAP = 6;
/** Extra open ring drawn around the true city marker on reveal, same idea as EarthSection's
 * ring around the true answer. */
export const TRUTH_MARKER_RING_RADIUS = 13;
/** Duration of the true contour's "drawn by a pen" reveal animation (see ContourBoard.tsx).
 * Kept fairly short: it's JS-driven (useNativeDriver: false, required for strokeDashoffset), and
 * holes can reveal in quick succession (one per player submitting), so a long duration risks
 * several overlapping timings' per-frame work stacking up on the JS thread. */
export const TRUTH_DRAW_DURATION_MS = 500;
/** Thin, dashed guess-to-solution connector line — kept subtle so it reads as a measuring line,
 * not another marker competing with the dots at either end. */
export const CONNECTOR_STROKE_WIDTH = 1.5;
export const CONNECTOR_DASH_PATTERN = '4,4';
