export const EARTH_RADIUS_RATIO = 0.36;
/** Player's vertical position (circle's apex at scale 1), as a share of the size. */
export const PLAYER_Y_RATIO = 0.21;
export const HEIGHT_RATIO = 0.98;
/** Share of the width / height where answers can extend once zoomed. */
export const AVAILABLE_X_RATIO = 0.44;
export const BOTTOM_MARGIN = 18;

/** Possible zooms on the circle (1 = real scale). */
export const ZOOM_STEPS = [1, 1.5, 2, 3, 4, 6, 8, 12, 20, 30] as const;
export const MAX_ZOOM = 30;

export const CAPTION_SURFACE = 'La Terre';
export const CAPTION_STRAIGHT = 'Coupe de la Terre';
export const PLAYER_LABEL = 'toi';
export const HORIZON_LABEL = 'horizon';

// Orbiting satellite, just for fun: on reveal, in distance mode (not straight line), and
// only zoomed out to the real scale (zoom 1 = the whole Earth visible, otherwise it would be
// off-screen or grotesquely close). A plane by day instead (see EarthSection), same orbit.
export const SATELLITE_EMOJI = '🛰️';
export const DAY_ORBIT_EMOJI = '✈️';
export const SATELLITE_ORBIT_MS = 28000;
export const SATELLITE_CLEARANCE = 46;
/** Joke on clicking the satellite (see `EarthSection`): hides itself after this delay, or
 * immediately if clicked again. */
export const SATELLITE_QUIP = 'La Terre est-elle ronde ? 🤔';
