export const MAX_COMPASS_SIZE = 300;
export const MAX_EARTH_SIZE = 240;

/** Paliers du zoom manuel (boutons +/-) sur la coupe de la Terre, a la revelation. */
export const ZOOM_MULTIPLIERS = [1, 1.5, 2, 3, 4, 6] as const;

export const LOADING_LABEL = 'Préparation de la partie…';
export const QUIT_LABEL = '✕  Quitter';
export const VALIDATE_LABEL = 'Valider';
export const NEXT_LABEL = 'Manche suivante';
export const LAST_LABEL = 'Voir le score';
export const ROUND_LABEL = 'Manche';
/** Au-dela, les pastilles de progression deviennent illisibles : on ne les affiche plus. */
export const MAX_PROGRESS_DOTS = 12;
export const ROUND_OVER_LABEL = 'Manche terminée';
export const REALITY_LABEL = 'Réponse';
export const YOUR_ANSWER_LABEL = 'Ta réponse';

/** Reponses des autres joueurs, deja donnees ce tour-ci : estompees pour ne pas se confondre avec la sienne. */
export const ANSWERED_OPACITY = 0.35;

/** A la revelation, les reponses des joueurs sont legerement estompees pour faire ressortir la vraie reponse. */
export const REVEAL_OPACITY = 0.8;
