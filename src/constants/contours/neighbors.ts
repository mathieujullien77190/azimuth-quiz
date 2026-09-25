import type { ContourNeighbor } from '@/types';

const country = (code: string, x: number, y: number): ContourNeighbor => ({ type: 'country', code, x, y });
const sea = (fr: string, en: string, x: number, y: number): ContourNeighbor => ({ type: 'sea', kind: 'sea', fr, en, x, y });
const ocean = (fr: string, en: string, x: number, y: number): ContourNeighbor => ({ type: 'sea', kind: 'ocean', fr, en, x, y });

/**
 * Hand-curated per-country neighbor lists (see `ContourNeighbor`) for the 8 Contour countries —
 * merged into each `ContourCountry` at decode time (see `codec.ts`), not a global by-code lookup:
 * the same neighbor can need a different display position depending on which country it's being
 * hinted from (e.g. Switzerland reads differently from France than from Germany), so every entry
 * is authored specifically for the country it appears under. `x`/`y` are a fraction (0-1) of that
 * country's own board canvas — draggable in the admin's Contour view, which shows/edits this exact
 * on-board spot (not a geographic coordinate to reproject), roughly near the shared border (a land
 * neighbor) or off toward open water in the geographically correct direction (a sea/ocean).
 */
export const CONTOUR_NEIGHBORS: Record<string, ContourNeighbor[]> = {
  FR: [
    country('BE', 0.712, 0.113),
    country('DE', 0.9604, 0.3584),
    country('CH', 0.888, 0.529),
    country('IT', 0.938, 0.664),
    country('ES', 0.358, 0.914),
    ocean('Atlantique', 'Atlantic', 0.198, 0.62),
    sea('Méditerranée', 'Mediterranean', 0.814, 0.925),
    sea('Manche', 'English Channel', 0.345, 0.167),
  ],
  ES: [
    country('PT', 0.0322, 0.5147),
    country('FR', 0.7983, 0.04),
    ocean('Atlantique', 'Atlantic', 0.3629, 0.04),
    sea('Méditerranée', 'Mediterranean', 0.9678, 0.6218),
  ],
  IT: [
    country('FR', 0.04, 0.3266),
    country('CH', 0.1991, 0.0381),
    country('AT', 0.4346, 0.0381),
    country('SI', 0.7811, 0.0381),
    sea('Mer Tyrrhénienne', 'Tyrrhenian Sea', 0.04, 0.5639),
    sea('Mer Adriatique', 'Adriatic Sea', 0.96, 0.3344),
  ],
  PT: [country('ES', 0.96, 0.5237), ocean('Atlantique', 'Atlantic', 0.04, 0.5244)],
  DE: [
    country('DK', 0.4033, 0.03),
    country('PL', 0.96, 0.3195),
    country('CZ', 0.96, 0.7869),
    country('AT', 0.7498, 0.97),
    country('CH', 0.2846, 0.97),
    country('FR', 0.04, 0.961),
    country('LU', 0.04, 0.6859),
    country('BE', 0.04, 0.5753),
    country('NL', 0.04, 0.3401),
    sea('Mer du Nord', 'North Sea', 0.164, 0.03),
    sea('Mer Baltique', 'Baltic Sea', 0.7411, 0.03),
  ],
  IE: [
    country('GB', 0.96, 0.1918),
    ocean('Atlantique', 'Atlantic', 0.04, 0.5718),
    sea("Mer d'Irlande", 'Irish Sea', 0.96, 0.5181),
  ],
  GR: [
    country('AL', 0.04, 0.2969),
    country('MK', 0.2489, 0.039),
    country('BG', 0.6963, 0.039),
    country('TR', 0.96, 0.2428),
    sea('Mer Égée', 'Aegean Sea', 0.96, 0.6997),
    sea('Mer Ionienne', 'Ionian Sea', 0.04, 0.689),
  ],
  NO: [
    country('SE', 0.2065, 0.9658),
    country('FI', 0.96, 0.1319),
    country('RU', 0.96, 0.2064),
    sea('Mer de Norvège', 'Norwegian Sea', 0.04, 0.2691),
    sea('Mer du Nord', 'North Sea', 0.04, 0.8415),
    sea('Mer de Barents', 'Barents Sea', 0.7013, 0.0342),
  ],
};
