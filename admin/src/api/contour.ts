import { countryName } from '@/constants/places/countries';
import { CONTOURS } from '@/constants/contours';
import type { ContourCountry, ContourNeighbor } from '@/types';

import { logChange } from '../changelog';
import type { PlaceRow } from './places';

/** Reads the bundled Contour country/neighbor data (no network, no backend — see changelog.ts):
 * kept `async` so call sites reading it don't need to change just because this no longer fetches
 * anything (same reasoning as fetchCountries/fetchPlaces). */
export const fetchContourCountries = async (): Promise<ContourCountry[]> => CONTOURS;

const neighborIdentity = (neighbor: ContourNeighbor): string => (neighbor.type === 'country' ? countryName(neighbor.code, 'fr') : neighbor.fr);

const fmtXY = (x: number, y: number): string => `x ${(x * 100).toFixed(1)}%, y ${(y * 100).toFixed(1)}%`;

/** A neighbor's on-board spot (see `ContourNeighbor`'s own doc comment — a fraction of the board
 * canvas, not a geographic coordinate) was dragged to a new spot: logs the before/after position
 * and returns the updated neighbor for the caller's own optimistic local state (same
 * update-state-then-log pattern as saveCountry/saveBoussole — see CountriesView.tsx). */
export const saveNeighborPosition = async (
  country: ContourCountry,
  neighbor: ContourNeighbor,
  next: { x: number; y: number },
): Promise<ContourNeighbor> => {
  logChange(
    `[Contour] ${countryName(country.code, 'fr')} — voisin ${neighborIdentity(neighbor)} : ${fmtXY(neighbor.x, neighbor.y)} -> ${fmtXY(next.x, next.y)}`,
  );
  return { ...neighbor, ...next };
};

/** Same `[Suppression] ...` wording as `deletePlace`, under our own `[Contour]` tag — see
 * ContourView.tsx's own optimistic-remove-then-log call site. */
export const deleteNeighbor = async (country: ContourCountry, neighbor: ContourNeighbor): Promise<void> => {
  logChange(`[Contour] ${countryName(country.code, 'fr')} — suppression du voisin ${neighborIdentity(neighbor)}`);
};

/** The target country's own flag/name anchor (see `ContourCountry.centerLabel`) was dragged to a
 * new spot — same before/after-logging, no-backend pattern as `saveNeighborPosition`. */
export const saveCenterLabelPosition = async (
  country: ContourCountry,
  previous: { x: number; y: number },
  next: { x: number; y: number },
): Promise<{ x: number; y: number }> => {
  logChange(`[Contour] ${countryName(country.code, 'fr')} — drapeau/nom du pays : ${fmtXY(previous.x, previous.y)} -> ${fmtXY(next.x, next.y)}`);
  return next;
};

/** Removes a place from Contour's own city-phase pool ONLY — unlike `deletePlace` (PlacesView's
 * own, a real deletion from the shared places.json), this place must stay untouched in
 * Boussole/Indices. Logged distinctly so applying the journal doesn't delete it everywhere: the
 * actual fix is adding it to `constants/contours/excludedPlaces.ts`'s curated set, not touching
 * places.json. */
export const excludePlaceFromContour = async (row: PlaceRow): Promise<void> => {
  logChange(`[Contour] ${row.name} (${row.code}) — exclu du jeu Silhouette uniquement, reste inchangé dans Boussole/Indices`);
};
