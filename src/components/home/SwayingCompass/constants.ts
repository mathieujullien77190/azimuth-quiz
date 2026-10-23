/** Premier ecart de l'aiguille par rapport au nord (degres). Chaque aller-retour garde `SWAY_DECAY` de l'ecart precedent. */
export const SWAY_START_DEG = 52;
export const SWAY_DECAY = 0.8;
/** Duree d'un sens (ms) et nombre de sens : 24 x 2,5 s = 60 s, l'aiguille s'immobilise au nord a la fin. */
export const SWAY_MS = 2500;
export const SWAY_LEGS = 24;
/** Centre du cadran, dans les unites 300 x 300 du SVG. */
export const DIAL_CENTER = 150;
