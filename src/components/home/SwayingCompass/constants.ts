/** Ecart maximal de l'aiguille par rapport au nord (degres), puis part de cet ecart gardee a chaque sens (`SWAY_DECAY`). */
export const SWAY_START_DEG = 55;
export const SWAY_DECAY = 0.8;
/** Duree d'un sens (ms) et nombre de sens : 24 x 2,5 s = 60 s, l'aiguille s'immobilise au nord a la fin. */
export const SWAY_MS = 2500;
export const SWAY_LEGS = 24;
export const SWAY_TOTAL_MS = SWAY_MS * SWAY_LEGS;
/** Points calcules par sens pour la courbe (interpolee lineairement entre deux points : assez fin pour etre fluide). */
export const SWAY_SAMPLES_PER_LEG = 12;
/** Centre du cadran, dans les unites 300 x 300 du SVG. */
export const DIAL_CENTER = 150;
