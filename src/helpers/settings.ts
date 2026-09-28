import { DIFFICULTIES, MAX_PLAYERS, MIN_PLAYERS, ROUND_OPTIONS } from '@/data';
import { CATEGORIES, DEFAULT_SETTINGS } from '@/games/compass/constants';
import type { Category, Difficulty, GameSettings } from '@/types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Rebuilds valid settings from stored data (potentially outdated or corrupted). */
export const sanitizeSettings = (raw: unknown): GameSettings => {
  if (!isRecord(raw)) return DEFAULT_SETTINGS;

  const names = Array.isArray(raw.playerNames)
    ? raw.playerNames.filter((name): name is string => typeof name === 'string').slice(0, MAX_PLAYERS)
    : [];
  const playerNames = names.length >= MIN_PLAYERS ? names : DEFAULT_SETTINGS.playerNames;

  const validCategories = CATEGORIES.map((category) => category.id);
  const categories = Array.isArray(raw.categories)
    ? raw.categories.filter((category): category is Category => validCategories.includes(category as Category))
    : [];

  // A single difficulty. Settings saved before that carried a `difficulties` list: its first valid
  // entry is kept.
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
    playerNames,
    categories: categories.length > 0 ? categories : DEFAULT_SETTINGS.categories,
    difficulty,
    rounds,
    useGps: flag(raw.useGps, DEFAULT_SETTINGS.useGps),
    customLatitude: coordinate(raw.customLatitude, -90, 90, DEFAULT_SETTINGS.customLatitude),
    customLongitude: coordinate(raw.customLongitude, -180, 180, DEFAULT_SETTINGS.customLongitude),
    liveCompass: flag(raw.liveCompass, DEFAULT_SETTINGS.liveCompass),
    showCountry: flag(raw.showCountry, DEFAULT_SETTINGS.showCountry),
    hideOtherAnswers: flag(raw.hideOtherAnswers, DEFAULT_SETTINGS.hideOtherAnswers),
  };
};
