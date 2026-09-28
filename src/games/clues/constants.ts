import { PLAYER_COLORS } from '@/data';
import type { ClueCategory, ClueId, ClueSettings } from '@/types';

// Same palette as Compass' own `ROOM_PLAYER_COLORS` (games/compass/constants.ts) — kept as its
// own copy rather than a shared import: it's just a color list, no behavior to diverge, and each
// game's room-player colors are its own tuning concern.
export const CLUE_ROOM_PLAYER_COLORS = [...PLAYER_COLORS, '#0D9488', '#4F46E5', '#C026D3', '#E11D48'] as const;

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
  playerNames: [''],
  difficulty: 'easy',
  categories: ['cities', 'citiesFr', 'capital'],
  rounds: 5,
  startWithFirstLetter: true,
};
