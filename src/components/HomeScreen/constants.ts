export const APP_TITLE = 'FULL AZIMUT';

// Empreinte approximative du bouton soucoupe (dome + anneau), pour la garder entierement visible
// quand elle se deplace aleatoirement dans la zone du titre.
export const UFO_FOOTPRINT = { width: 56, height: 64 };
// Duree du "vol" (transition) d'une position a l'autre.
export const UFO_MOVE_DURATION_MS = 350;
// Duree de pause a l'arret entre deux deplacements, tiree au sort a chaque cycle.
export const UFO_PAUSE_OPTIONS_S = [3, 4, 5, 6] as const;
// Quand la pause tiree au sort vaut cette duree, la soucoupe fait un tour sur elle-meme pendant la
// pause (rotation rapide, ne dure pas toute la pause).
export const UFO_SPIN_PAUSE_S = 6;
export const UFO_SPIN_DURATION_MS = 1000;
