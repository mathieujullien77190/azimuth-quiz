export const EARTH_RADIUS_RATIO = 0.36;
/** Position verticale du joueur (sommet du cercle a l'echelle 1), en part de la taille. */
export const PLAYER_Y_RATIO = 0.21;
export const HEIGHT_RATIO = 0.98;
/** Part de la largeur / hauteur ou les reponses peuvent s'etendre une fois zoome. */
export const AVAILABLE_X_RATIO = 0.44;
export const BOTTOM_MARGIN = 18;

/** Zooms possibles sur le cercle (1 = echelle reelle). */
export const ZOOM_STEPS = [1, 1.5, 2, 3, 4, 6, 8, 12, 20, 30] as const;
export const MAX_ZOOM = 30;

export const CAPTION_SURFACE = 'La Terre';
/** Libelles du bouton Terre de profil / globe 3D (celui vers lequel il mene). */
export const SWITCH_TO_EARTH = '2D';
export const SWITCH_TO_GLOBE = '3D';
export const PLAYER_LABEL = 'toi';

// Satellite pour le fun, a la revelation et seulement a l'echelle reelle (zoom 1) : sinon hors ecran ou
// grotesquement proche. Un avion le jour (voir EarthSection), meme orbite.
export const SATELLITE_EMOJI = '🛰️';
export const SATELLITE_ORBIT_MS = 28000;
export const SATELLITE_CLEARANCE = 46;
/** Blague au clic sur le satellite (voir `EarthSection`) : disparait apres ce delai, ou au clic suivant. */
export const SATELLITE_QUIP = 'La Terre est-elle ronde ? 🤔';
