/** L'aiguille oscille entre ces deux caps (degres, 0 = nord), un sens en `SWAY_MS`, puis retour. */
export const NEEDLE_FROM_DEG = -38;
export const NEEDLE_TO_DEG = 52;
export const SWAY_MS = 2500;
/** Taille du cadran (px) et rayon de ses parties, dans les unites 300 x 300 du SVG. */
export const DIAL_SIZE = 300;
export const DIAL_CENTER = 150;
/** Le libelle « chargement » respire entre ces opacites, un sens en `BLINK_MS`. */
export const BLINK_MIN_OPACITY = 0.35;
export const BLINK_MS = 700;
/** Duree du fondu de sortie une fois l'app prete (ms). */
export const FADE_OUT_MS = 250;
/**
 * Forme de la barre (`buildProgressSteps`) : depart et duree de chaque keyframe en parts du temps minimum, et
 * cible (pourcent). Sauts rapides (`ease` court), passages lents (`ease` long) et blocages (ecarts entre
 * keyframes), dont un long vers les deux tiers. Le dernier n'a pas d'`ease` : il va jusqu'au temps minimum.
 */
export const PROGRESS_BEATS = [
  { start: 0.03, ease: 0.05, to: 8 },
  { start: 0.14, ease: 0.16, to: 18 },
  { start: 0.36, ease: 0.04, to: 35 },
  { start: 0.44, ease: 0.1, to: 48 },
  { start: 0.56, ease: 0.03, to: 66 },
  { start: 0.74, ease: 0.04, to: 90 },
  { start: 0.86, ease: 0, to: 97 },
] as const;
/** Ecart d'un lancement sur chaque depart (part du temps minimum) et chaque cible (pourcent), par rapport au modele. */
export const PROGRESS_JITTER_AT = 0.015;
export const PROGRESS_JITTER_TO = 3;
/** Pause minimale (part du temps minimum) entre deux keyframes, malgre l'aleatoire. */
export const PROGRESS_MIN_STALL = 0.015;
/** Valeur finale de la derniere keyframe (pourcent) : jamais 100, reserve a la liberation. */
export const PROGRESS_FINAL_MIN = 96;
export const PROGRESS_FINAL_MAX = 97.5;
