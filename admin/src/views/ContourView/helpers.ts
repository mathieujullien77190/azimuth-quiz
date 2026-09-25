import { countryName, flagEmoji } from '@/constants/places/countries';
import type { ContourCountry, ContourNeighbor } from '@/types';

/**
 * Icon/name for a curated neighbor — mirrors ContourGameScreen/helpers.ts's own
 * `neighborIcon`/`neighborName`, kept as small local copies rather than imported directly: that
 * module pulls in the main app's top-level `@/constants` barrel (theme/RN-dependent), which isn't
 * safe to bundle into this plain-React admin app (see ContourView.tsx's own note on
 * `@/components/ContourBoard/helpers`).
 */
export const neighborIcon = (neighbor: ContourNeighbor): string =>
  neighbor.type === 'country' ? flagEmoji(neighbor.code) : neighbor.kind === 'ocean' ? '🐳' : '🐟';

export const neighborName = (neighbor: ContourNeighbor): string => (neighbor.type === 'country' ? countryName(neighbor.code, 'fr') : neighbor.fr);

/** Same idea as CountriesView's own `filterCountries` (name/code substring match) — only ever
 * filters the 8 curated Contour countries, not the full 196-country list. */
export const filterContourCountries = (countries: ContourCountry[], query: string): ContourCountry[] => {
  const q = query.trim().toLowerCase();
  if (!q) return countries;
  return countries.filter((c) => countryName(c.code, 'fr').toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
};
