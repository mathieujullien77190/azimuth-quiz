export const CAPTION_GLOBE = 'Globe 3D';
/** Points of a route: smooth to the eye even for a half-turn of the Earth. */
export const ROUTE_STEPS = 64;
/** Degrees between two points of the equator and of the Greenwich meridian (smooth to the eye at this step). */
export const GUIDE_STEP = 5;

// --- The scene ---
// The globe is a sphere of radius 1 around the middle of the scene: every size below is in those units.
/** How round the ball is: enough segments for a smooth outline even zoomed all the way in. */
export const SPHERE_SEGMENTS = 72;
/** What is drawn on the ground is pushed out a hair, in this order, so that each layer wins its pixels over the one
 * below instead of flickering against it. */
export const LAND_ALTITUDE = 1.001;
export const GUIDE_ALTITUDE = 1.002;
export const ROUTE_ALTITUDE = 1.004;
export const MARK_ALTITUDE = 1.006;
/** An answer's route is a tube, not a line: WebGL ignores the width of a line on most devices. */
export const ROUTE_THICKNESS = 0.007;
export const ROUTE_SIDES = 6;
/** The dots: the starting point, the end of an answer, the north pole. */
export const ORIGIN_DOT = 0.03;
export const MARK_DOT = 0.026;
export const POLE_DOT = 0.02;
export const DOT_SEGMENTS = 16;
/** The ring around the true answer. */
export const TRUTH_RING = 0.06;
export const TRUTH_RING_THICKNESS = 0.009;
/** Dashes of the equator and of the Greenwich meridian. */
export const GUIDE_DASH = 0.05;
export const GUIDE_GAP = 0.035;
/** How much light the ball gets from every side, and from the lamp that follows the camera (so the same side always
 * catches the light, however the globe is turned), and where that lamp is: up and to the left, as in the 2D view. */
export const AMBIENT_LIGHT = 0.6;
export const HEADLIGHT = 0.8;
export const HEADLIGHT_POSITION: [number, number, number] = [-0.6, 0.8, 1];
/** How far the camera stands from the middle of the globe. The ball (radius 1) is between `DISTANCE - 1` and
 * `DISTANCE + 1`, so this is what the depth range is cut around. */
export const CAMERA_DISTANCE = 4;
export const CAMERA_NEAR = CAMERA_DISTANCE - 1.5;
export const CAMERA_FAR = CAMERA_DISTANCE + 1.5;

// --- Turning and zooming ---
/** The globe cannot be tipped past this latitude: the poles stay out of the middle, the view never flips over. */
export const MAX_CENTER_LATITUDE = 85;
/** Zoom 1 = the whole ball fits the drawing. */
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
/** One press on + or − multiplies (or divides) the zoom by this. */
export const ZOOM_STEP = 1.4;
/** Buttons: zoom, and back to the starting view (north up, everything in sight). */
export const ZOOM_IN_LABEL = '+';
export const ZOOM_OUT_LABEL = '−';
export const RESET_LABEL = '⌖ N';
export const ZOOM_IN_HINT = 'Zoomer';
export const ZOOM_OUT_HINT = 'Dézoomer';
export const RESET_HINT = 'Remettre le globe au nord';

// --- The drawing ---
/** Space kept around the globe so its outline is not cut by the edge of the drawing. */
export const GLOBE_MARGIN = 3;
/** Room kept above the origin for its label. */
export const LABEL_OFFSET = 11;
/** The north pole is a dot with an "N" next to it. */
export const AXIS_LABEL_SIZE = 11;
/** The satellite flies this much higher than the ground, as a share of the globe's radius: it is seen beyond the outline. */
export const ORBIT_RATIO = 1.12;
/** One full turn round the Earth, and how often the satellite is moved while it flies. */
export const ORBIT_MS = 24000;
export const ORBIT_TICK_MS = 50;
