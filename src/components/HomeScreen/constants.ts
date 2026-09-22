import type { Rule } from './types';

export const APP_TITLE = 'FULL AZIMUT';
export const APP_TAGLINE = 'Devine où se trouve un lieu du monde : dans quelle direction, à quelle distance ?';
export const PLAY_LABEL = 'Jouer';

export const DECORATIVE_BEARING = 42;
export const MAX_COMPASS_SIZE = 280;

export const RULES: Rule[] = [
  { emoji: '📍', text: 'Un lieu s’affiche : ville, montagne, monument ou site naturel.' },
  { emoji: '🧭', text: 'Oriente la boussole vers lui. Sur téléphone, le N pointe vers le vrai nord.' },
  { emoji: '📏', text: 'Estime la distance, puis compare avec la vraie réponse sur la Terre.' },
  { emoji: '👥', text: 'Seul ou jusqu’à 6 joueurs, sur le même téléphone.' },
];
