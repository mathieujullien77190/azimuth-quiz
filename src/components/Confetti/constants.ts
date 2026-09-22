export const PIECE_COUNT = 60;
export const SEED = 42;

export const MIN_SIZE = 5;
export const MAX_SIZE = 10;
// Chute a passage unique (pas de boucle) : chaque piece tombe une fois entre son delai et la
// fin de sa chute, puis disparait. Les bornes ci-dessous sont choisies pour que meme la derniere
// piece (delai max + chute max) ait fini avant BURST_MS, sans coupure nette en plein vol.
export const MIN_FALL_MS = 2200;
export const MAX_FALL_MS = 3800;
export const MAX_DELAY_MS = 1200;
export const MIN_DRIFT_AMPLITUDE = 10;
export const MAX_DRIFT_AMPLITUDE = 40;
export const MIN_DRIFT_PERIOD_MS = 1200;
export const MAX_DRIFT_PERIOD_MS = 2600;
export const MAX_SPIN_SPEED = 0.25;

// Frequence de rafraichissement : assez pour une chute fluide sans surcharger le rendu SVG.
export const TICK_MS = 50;

// Duree totale de la pluie de confettis (~5s) : delai max + chute max, la derniere piece a fini
// pile a ce moment-la, donc pas besoin de coupure forcee.
export const BURST_MS = MAX_DELAY_MS + MAX_FALL_MS;
