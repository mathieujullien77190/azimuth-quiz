export const TICK_STEP_DEG = 5;

// Proportions relative to the compass's radius.
export const FACE_RADIUS_RATIO = 0.96;
export const TICK_OUTER_RATIO = 0.93;
export const TICK_LENGTH_RATIO = { cardinal: 0.13, intercardinal: 0.09, minor: 0.05 } as const;
export const LABEL_RADIUS_RATIO = 0.68;
export const NEEDLE_LENGTH_RATIO = 0.66;
export const NEEDLE_TAIL_RATIO = 0.18;
export const NEEDLE_HALF_WIDTH_RATIO = 0.075;
export const KNOB_RADIUS_RATIO = 0.74;

/** N/E/S fixed; west depends on the language (see Compass/helpers.ts `cardinalPoints`). */
export const CARDINAL_BEARINGS = { N: 0, E: 90, S: 180, W: 270 } as const;

// Sensor heading: fraction of the path covered on each reading (0-1), and threshold below which it's ignored.
export const HEADING_SMOOTHING = 0.3;
export const HEADING_DEADBAND_DEG = 0.6;
export const NORTH_MARKER_WIDTH = 16;
export const NORTH_MARKER_HEIGHT = 11;
