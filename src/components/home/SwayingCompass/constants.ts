/** Ecart maximal de l'aiguille par rapport au nord (degres), puis part de cet ecart gardee a chaque sens (`SWAY_DECAY`). */
export const SWAY_START_DEG = 55;
export const SWAY_DECAY = 0.8;
/** Duree d'un sens du balancier (ms) et nombre de sens de la courbe complete. */
export const SWAY_MS = 2500;
export const SWAY_LEGS = 24;
export const SWAY_TOTAL_MS = SWAY_MS * SWAY_LEGS;
/** Points calcules par sens pour la courbe (interpolee lineairement entre deux points : assez fin pour etre fluide). */
export const SWAY_SAMPLES_PER_LEG = 12;
/**
 * Les tours rapides partent a un sommet du balancier (l'aiguille y est a l'arret), apres un nombre aleatoire de sens
 * entre ces deux bornes: l'ecart est alors deja petit, l'aiguille lente.
 */
export const SPIN_AFTER_LEGS_MIN = 5;
export const SPIN_AFTER_LEGS_MAX = 14;
/** Nombre de tours rapides (tire entre les deux), duree de chaque tour et de la mise en vitesse / du freinage (ms). */
export const SPIN_TURNS_MIN = 2;
export const SPIN_TURNS_MAX = 4;
export const SPIN_TURN_MS = 700;
export const SPIN_EASE_MS = 700;
/** Limite des angles que l'aiguille peut atteindre pendant les tours (degres), pour l'interpolation de la rotation. */
export const MAX_ANGLE_DEG = 2000;
/** Centre du cadran, dans les unites 300 x 300 du SVG. */
export const DIAL_CENTER = 150;
