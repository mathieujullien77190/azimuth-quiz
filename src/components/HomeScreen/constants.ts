import type { Rule } from './types';

export const APP_TITLE = 'FULL AZIMUT';
export const APP_TAGLINE = 'Devine où se trouve un lieu du monde : direction, inclinaison, distance ?';
export const PLAY_LABEL = 'Jouer';

export const DECORATIVE_BEARING = 42;
export const MAX_COMPASS_SIZE = 280;

export const RULES: Rule[] = [
  { emoji: '📍', text: 'Un lieu s’affiche.' },
  { emoji: '🧭', text: 'Oriente la boussole vers lui et estime la distance.' },
  { emoji: '🎯', text: 'Compare avec la vraie réponse.' },
  { emoji: '👥', text: 'Seul ou à 6 joueurs.' },
];
