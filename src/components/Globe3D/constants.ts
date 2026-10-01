export const CAPTION_GLOBE = 'Globe 3D';
/** Points of a route: smooth to the eye even for a half-turn of the Earth. */
export const ROUTE_STEPS = 64;
export const ROUTE_WIDTH = 2.5;
export const END_RADIUS = 4;
export const TRUTH_RING_RADIUS = 8;
export const ORIGIN_RADIUS = 4.5;
/** Room kept above the origin for its label. */
export const LABEL_OFFSET = 9;
/** Space kept around the globe so its outline is not cut by the edge of the drawing. */
export const GLOBE_MARGIN = 3;
/** The globe cannot be tipped past this latitude: the poles stay out of the middle, the view never flips over. */
export const MAX_CENTER_LATITUDE = 85;
/** The satellite flies this much higher than the ground, as a share of the globe's radius: it is seen beyond the outline. */
export const ORBIT_RATIO = 1.12;
/** One full turn round the Earth, and how often the satellite is moved while it flies. */
export const ORBIT_MS = 24000;
export const ORBIT_TICK_MS = 50;
/** Degrees between two points of the equator and of the Greenwich meridian (smooth to the eye at this step). */
export const GUIDE_STEP = 5;
export const GUIDE_DASH = '5 4';
/** The north axis: a line through the middle of the globe, this much longer than its radius, with an "N" at its north end. */
export const AXIS_RATIO = 1.05;
export const AXIS_LABEL_SIZE = 11;
export const POLE_RADIUS = 3;
