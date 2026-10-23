import { DIFFICULTIES, ROUND_OPTIONS } from '@/data';
import { CATEGORIES, DEFAULT_SETTINGS } from '@/games/constants';
import type { Category, Difficulty, GameSettings } from '@/types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Reconstruit des reglages valides depuis des donnees stockees (possiblement perimees ou corrompues). */
export const sanitizeSettings = (raw: unknown): GameSettings => {
  if (!isRecord(raw)) return DEFAULT_SETTINGS;

  // Anciens reglages multi-joueurs : `playerNames`, dont le premier est ce joueur.
  const legacyName = Array.isArray(raw.playerNames) ? raw.playerNames[0] : undefined;
  const savedName = typeof raw.playerName === 'string' ? raw.playerName : legacyName;
  const playerName = typeof savedName === 'string' ? savedName : DEFAULT_SETTINGS.playerName;

  const validCategories = CATEGORIES.map((category) => category.id);
  const categories = Array.isArray(raw.categories)
    ? raw.categories.filter((category): category is Category => validCategories.includes(category as Category))
    : [];

  // Anciens reglages : liste `difficulties`, on garde la premiere valide.
  const validDifficulties = DIFFICULTIES.map((entry) => entry.id);
  const isDifficulty = (value: unknown): value is Difficulty => validDifficulties.includes(value as Difficulty);
  const difficulty = isDifficulty(raw.difficulty)
    ? raw.difficulty
    : ((Array.isArray(raw.difficulties) ? raw.difficulties.find(isDifficulty) : undefined) ??
      DEFAULT_SETTINGS.difficulty);

  const rounds = ROUND_OPTIONS.some((option) => option === raw.rounds)
    ? (raw.rounds as number)
    : DEFAULT_SETTINGS.rounds;
  const flag = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);
  const coordinate = (value: unknown, min: number, max: number, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback;

  return {
    playerName,
    categories: categories.length > 0 ? categories : DEFAULT_SETTINGS.categories,
    difficulty,
    rounds,
    useGps: flag(raw.useGps, DEFAULT_SETTINGS.useGps),
    customLatitude: coordinate(raw.customLatitude, -90, 90, DEFAULT_SETTINGS.customLatitude),
    customLongitude: coordinate(raw.customLongitude, -180, 180, DEFAULT_SETTINGS.customLongitude),
    liveCompass: flag(raw.liveCompass, DEFAULT_SETTINGS.liveCompass),
    showCountry: flag(raw.showCountry, DEFAULT_SETTINGS.showCountry),
    travel: flag(raw.travel, DEFAULT_SETTINGS.travel),
  };
};
