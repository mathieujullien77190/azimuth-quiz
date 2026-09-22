// Nombre d'etoiles et graine (fixe : le ciel ne doit pas "sauter" a chaque rendu).
export const STAR_COUNT = 70;
export const STAR_SEED = 7;
export const STAR_MIN_RADIUS = 0.4;
export const STAR_MAX_RADIUS = 1.6;
export const STAR_MIN_OPACITY = 0.15;
export const STAR_MAX_OPACITY = 0.75;

// Scintillement : chaque etoile respire entre TWINKLE_MIN_OPACITY_RATIO x son opacite max et
// son opacite max, a son propre rythme (duree + delai avant le premier cycle).
export const TWINKLE_MIN_OPACITY_RATIO = 0.25;
export const TWINKLE_MIN_DURATION_MS = 1400;
export const TWINKLE_MAX_DURATION_MS = 3600;
export const TWINKLE_MAX_DELAY_MS = 3000;
// Frequence de rafraichissement du scintillement : pas besoin de 60fps pour un effet aussi lent.
export const TWINKLE_TICK_MS = 120;
