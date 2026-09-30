import type { Language } from '@/i18n';
import type { ContourNamedNeighbor, ContourRoundCountry } from '@/types';

import { flagEmoji } from '@/helpers/flagEmoji';

/** Tier-1 icon for a curated neighbor entry: its flag. */
export const neighborIcon = (neighbor: ContourNamedNeighbor): string => flagEmoji(neighbor.code);

/** Tier-3 display name for a curated neighbor entry, in the active UI language: its names are copied in. */
export const neighborName = (neighbor: ContourNamedNeighbor, language: Language): string =>
  language === 'fr' ? neighbor.fr : neighbor.en;

/** The round's country name in the active UI language (from its document, nothing is looked up). */
export const roundCountryName = (country: Pick<ContourRoundCountry, 'fr' | 'en'>, language: Language): string =>
  language === 'fr' ? country.fr : country.en;

/** Normalizes a guessed country name for comparison: mirrors ClueGameScreen/helpers.ts's own
 * `normalizePlaceGuess` (lowercased, accents/spaces/punctuation all dropped outright, not just
 * collapsed — "Côte d'Ivoire", "Cote d Ivoire" and "Coted'Ivoire" all compare equal) — kept as
 * its own small copy here rather than a cross-component import, per this repo's one-folder-per-
 * feature convention (see CLAUDE.md's `react-structure`). */
export const normalizeContourGuess = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
