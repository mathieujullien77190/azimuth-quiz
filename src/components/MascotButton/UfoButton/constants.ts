// Taille du bouton (soucoupe + dome), en px.
export const SIZE = 40;
// Cadence de rafraichissement de l'animation.
export const TICK_MS = 50;

// Flottement vertical continu.
export const BOB_AMPLITUDE = 3;
export const BOB_PERIOD_MS = 2200;
// Clignotement des feux du bord.
export const BLINK_PERIOD_MS = 500;

// Dome en « verre depoli » : bleu translucide avec reflet, hors tokens de theme.
export const DOME_COLOR = '#8FD8FF';
export const DOME_HIGHLIGHT_COLOR = '#FFFFFF';

// Cone de lumiere sous la soucoupe, meme teinte que le dome (opacite en haut, 0 en bas).
export const CONE_OPACITY = 0.4;
// Demi-largeur du faisceau en haut et en bas, en fraction du rayon (1 = largeur du bouton, le canvas coupe au-dela).
export const CONE_TOP_RATIO = 0.4;
export const CONE_BOTTOM_RATIO = 0.98;
export const CONE_GRADIENT_ID = 'ufo-light-cone';
// Position de l'engrenage sous le haut du cone, en fraction de SIZE.
export const GEAR_OFFSET_Y = 0.55;
