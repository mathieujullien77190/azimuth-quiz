import type { ClueCategory, ClueId, ClueSettings } from '@/types';

/** How many times each Clues place has been drawn, across every game — lets rounds avoid
 * repeats (see helpers/clueHistory.ts). */
export const CLUE_HISTORY_STORAGE_KEY = 'azimuthquiz:clue-history';

// Display order in the grid: from easiest (highest cost, at the top) to hardest (cost
// 1, purple, at the bottom). Every round now shows all clues (no more subset):
// so this order is the full display order, not just a visual sort of a partial draw.
export const CLUE_ORDER: ClueId[] = [
  'population',
  'localTime',
  'letter',
  'isCapital',
  'bearing',
  'distance',
  'climate',
  'emoji',
  'flagColors',
  'position',
  'elevation',
  'airportCode',
  'currency',
  'phoneCode',
];

// Reuses Compass's category id/emoji/label conventions (see games/compass/constants.ts and
// i18n's setup.categories) rather than duplicating them — only these 3 of the 7 Compass
// categories apply to Clues, since its whole pool is cities.
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
/** Fixed penalty for buzzing in and being wrong: unlike an unfound round
 * (0 points, see `giveUp`), being wrong genuinely costs something — otherwise buzzing at
 * random would always be risk-free. */
export const WRONG_ANSWER_PENALTY = 10;
