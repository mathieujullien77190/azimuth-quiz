// Button size (saucer + dome), in px.
export const SIZE = 40;
// Animation refresh rate.
export const TICK_MS = 50;

// Continuous vertical bobbing.
export const BOB_AMPLITUDE = 3;
export const BOB_PERIOD_MS = 2200;
// Blinking of the rim lights.
export const BLINK_PERIOD_MS = 500;

// "Frosted glass" dome: translucent blue with a highlight, rather than a theme color.
export const DOME_COLOR = '#8FD8FF';
export const DOME_HIGHLIGHT_COLOR = '#FFFFFF';

// Light cone under the saucer: translucent, same tint as the dome.
// (opacity at the top of the beam: it fades to 0 at the bottom).
export const CONE_OPACITY = 0.4;
// Half-width of the beam at its top and at its bottom, as a fraction of the saucer's radius (1 = the
// button's full width: the canvas clips anything wider).
export const CONE_TOP_RATIO = 0.4;
export const CONE_BOTTOM_RATIO = 0.98;
export const CONE_GRADIENT_ID = 'ufo-light-cone';
// Where the gear sits under the cone's top, as a fraction of SIZE.
export const GEAR_OFFSET_Y = 0.55;
