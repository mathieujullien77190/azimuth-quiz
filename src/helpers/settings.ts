import {
  CATEGORIES,
  DEFAULT_SETTINGS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NAME_PLACEHOLDERS,
  ROUND_OPTIONS,
  ZONES,
} from '@/constants';
import type { Category, GameSettings, Zone } from '@/types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Nom d'un joueur : celui saisi, sinon un prenom de secours choisi par index (stable pour toute
 * la partie), le meme genre de placeholder que SetupScreen montre pour un champ vide — pas
 * "Joueur N" pour tout le monde, qui donnerait les memes initiales "JO" a tous les joueurs. */
export const playerDisplayName = (name: string, index: number): string =>
  name.trim() || NAME_PLACEHOLDERS[index % NAME_PLACEHOLDERS.length];

/** Reconstruit des reglages valides a partir de donnees stockees (potentiellement anciennes ou abimees). */
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

  const zone = ZONES.some((candidate) => candidate.id === raw.zone) ? (raw.zone as Zone) : DEFAULT_SETTINGS.zone;
  const rounds = ROUND_OPTIONS.some((option) => option === raw.rounds) ? (raw.rounds as number) : DEFAULT_SETTINGS.rounds;
  const flag = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);

  return {
    playerNames,
    categories: categories.length > 0 ? categories : DEFAULT_SETTINGS.categories,
    zone,
    rounds,
    // Anciens reglages : les deux options "ligne droite" separees deviennent un seul mode.
    straightLine: flag(raw.straightLine, raw.straightDistance === true || raw.straightDirection === true),
    useGps: flag(raw.useGps, DEFAULT_SETTINGS.useGps),
    showCountry: flag(raw.showCountry, DEFAULT_SETTINGS.showCountry),
    allowRevision: flag(raw.allowRevision, DEFAULT_SETTINGS.allowRevision),
  };
};
