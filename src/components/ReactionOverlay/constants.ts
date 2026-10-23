import { REACTION_DISPLAY_MS } from '@/data';

/** Duree de montee d'une bulle du bas au haut de l'ecran, en fondu entree/sortie. */
export const RISE_MS = REACTION_DISPLAY_MS;
/** Points de la timeline 0-1 ou finit le fondu d'entree et commence le fondu de sortie. */
export const FADE_IN_END = 0.1;
export const FADE_OUT_START = 0.75;
/** Une bulle part de cette hauteur (px) au-dessus du bas de l'overlay : au-dessus du footer. */
export const BOTTOM_OFFSET = 130;
/** Oscillation laterale : amplitude (px) et nombre d'allers-retours pendant la montee. */
export const WOBBLE_PX = 10;
export const WOBBLE_CYCLES = 3;
/** Pas de la courbe d'oscillation (un sinus echantillonne : Animated interpole entre les echantillons). */
export const WOBBLE_STEPS = 24;
/**
 * Les bulles successives ne montent pas sur la meme ligne : decalage de ce nombre de px, sur ce nombre de
 * voies (deduit de `seq`, donc identique sur chaque appareil).
 */
export const LANE_PX = 34;
export const LANES = 5;
