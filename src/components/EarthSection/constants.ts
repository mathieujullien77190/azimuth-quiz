export const EARTH_RADIUS_RATIO = 0.36;
/** Position verticale du joueur (sommet du cercle a l'echelle 1), en part de la taille. */
export const PLAYER_Y_RATIO = 0.21;
export const HEIGHT_RATIO = 0.98;
/** Part de la largeur / de la hauteur ou les reponses peuvent s'etendre une fois zoome. */
export const AVAILABLE_X_RATIO = 0.44;
export const BOTTOM_MARGIN = 18;

/** Zooms possibles sur le cercle (1 = echelle reelle). */
export const ZOOM_STEPS = [1, 1.5, 2, 3, 4, 6, 8, 12, 20, 30] as const;
export const MAX_ZOOM = 30;

export const CAPTION_SURFACE = 'La Terre';
export const CAPTION_STRAIGHT = 'Coupe de la Terre';
export const PLAYER_LABEL = 'toi';
export const HORIZON_LABEL = 'horizon';

// Satellite qui orbite pour rigoler : a la revelation, en mode distance (pas ligne droite), et
// seulement dezoome a l'echelle reelle (zoom 1 = la Terre entiere visible, sinon il serait hors
// champ ou grotesquement proche).
export const SATELLITE_EMOJI = '🛰️';
export const SATELLITE_ORBIT_MS = 28000;
export const SATELLITE_CLEARANCE = 46;
