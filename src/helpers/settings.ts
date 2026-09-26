import { CATEGORIES, DEFAULT_SETTINGS, DIFFICULTIES, MAX_PLAYERS, MIN_PLAYERS, NAME_PLACEHOLDERS, ROUND_OPTIONS } from '@/constants';
import type { Category, Difficulty, GameSettings } from '@/types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** A player's display name: the one entered, otherwise a fallback first name chosen by index
 * (stable for the whole game), the same kind of placeholder SetupScreen shows for an empty
 * field — not "Player N" for everyone, which would give every player the same "PL" initials. */
export const playerDisplayName = (name: string, index: number): string =>
  name.trim() || NAME_PLACEHOLDERS[index % NAME_PLACEHOLDERS.length];

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

  // Single choice (radio): even old saved settings with multiple difficulties only
  // keep the first valid one.
  const validDifficulties = DIFFICULTIES.map((difficulty) => difficulty.id);
  const firstValidDifficulty = Array.isArray(raw.difficulties)
    ? raw.difficulties.find((difficulty): difficulty is Difficulty =>
        validDifficulties.includes(difficulty as Difficulty),
      )
    : undefined;
  const difficulties = firstValidDifficulty !== undefined ? [firstValidDifficulty] : DEFAULT_SETTINGS.difficulties;

  const rounds = ROUND_OPTIONS.some((option) => option === raw.rounds)
    ? (raw.rounds as number)
    : DEFAULT_SETTINGS.rounds;
  const flag = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);
  const coordinate = (value: unknown, min: number, max: number, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback;

  return {
    playerNames,
    categories: categories.length > 0 ? categories : DEFAULT_SETTINGS.categories,
    difficulties,
    rounds,
    // Old settings: the two separate "straight line" options collapse into a single mode.
    straightLine: flag(raw.straightLine, raw.straightDistance === true || raw.straightDirection === true),
    useGps: flag(raw.useGps, DEFAULT_SETTINGS.useGps),
    customLatitude: coordinate(raw.customLatitude, -90, 90, DEFAULT_SETTINGS.customLatitude),
    customLongitude: coordinate(raw.customLongitude, -180, 180, DEFAULT_SETTINGS.customLongitude),
    liveCompass: flag(raw.liveCompass, DEFAULT_SETTINGS.liveCompass),
    showCountry: flag(raw.showCountry, DEFAULT_SETTINGS.showCountry),
    hideOtherAnswers: flag(raw.hideOtherAnswers, DEFAULT_SETTINGS.hideOtherAnswers),
  };
};
