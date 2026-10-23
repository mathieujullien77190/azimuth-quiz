// Taille du bouton (fuselage + rotor), en px.
export const SIZE = 40;
// Cadence de rafraichissement de l'animation.
export const TICK_MS = 50;

// Flottement vertical continu.
export const BOB_AMPLITUDE = 3;
export const BOB_PERIOD_MS = 2200;
// Feu anticollision clignotant (queue).
export const BLINK_PERIOD_MS = 500;
// Rotor : un tour par ROTOR_PERIOD_MS (rapide, il doit faire un flou).
export const ROTOR_PERIOD_MS = 260;

// Bulle du cockpit : bleu translucide avec reflet, hors tokens de theme.
export const COCKPIT_COLOR = '#8FD8FF';
export const COCKPIT_HIGHLIGHT_COLOR = '#FFFFFF';

// Corde sous le fuselage, terminee par l'engrenage (le meme que la soucoupe).
export const ROPE_LENGTH_RATIO = 0.4;
export const GEAR_RADIUS_RATIO = 0.285;
