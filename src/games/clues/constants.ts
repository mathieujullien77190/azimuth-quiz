import type { ClueCategory, ClueId, ClueSettings } from '@/types';

/** Position de cet appareil dans chaque groupe Indices, pour prendre les lieux suivants (voir `helpers/clueCursors.ts`). */
export const CLUE_CURSORS_STORAGE_KEY = 'azimuthquiz:clue-cursors';

// Ordre d'affichage : du plus facile (cout le plus haut, en haut) au plus dur (cout 1, violet, en bas).
export const CLUE_ORDER: ClueId[] = [
  'population',
  'localTime',
  'letter',
  'isCapital',
  'personality',
  'bearing',
  'distance',
  'globe',
  'climate',
  'emoji',
  'flagColors',
  'position',
  'elevation',
  'airportCode',
  'currency',
  'phoneCode',
  // Le jeu de mots ferme la liste, quel que soit son cout.
  'wordplay',
];

// Reprend les conventions de categories de Compass (id/emoji/libelle) ; seules 3 des 7 s'appliquent ici (que des villes).
export const CLUE_CATEGORIES: { id: ClueCategory; emoji: string }[] = [
  { id: 'cities', emoji: '🏙️' },
  { id: 'citiesFr', emoji: '🥖' },
  { id: 'capital', emoji: '⭐' },
];

export const DEFAULT_CLUE_SETTINGS: ClueSettings = {
  playerName: '',
  difficulty: 'easy',
  categories: ['cities', 'citiesFr', 'capital'],
  rounds: 5,
  startWithFirstLetter: true,
};
/** Penalite fixe d'une mauvaise reponse : sinon buzzer au hasard serait sans risque. */
export const WRONG_ANSWER_PENALTY = 10;
