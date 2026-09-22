import type { Rule } from './types';

export const APP_TITLE = 'FULL AZIMUT';
export const APP_TAGLINE = 'Devine où se trouve un lieu du monde\ndirection, inclinaison, distance ?';
export const PLAY_LABEL = 'Jouer';

// Nord au repos ; l'aiguille reste ensuite libre (Compass interactif, demo pure, pas de score).
export const DECORATIVE_BEARING = 0;
export const MAX_COMPASS_SIZE = 280;

export const RULES: Rule[] = [
  { emoji: '📍', text: 'Un lieu s’affiche.' },
  { emoji: '🧭', text: 'Oriente la boussole vers lui et estime la distance.' },
  { emoji: '🎯', text: 'Compare avec la vraie réponse.' },
  { emoji: '👥', text: 'Seul ou à 6 joueurs.' },
];
