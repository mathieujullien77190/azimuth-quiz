import type { PlaceRow } from '../../api/places';
import { countryFor } from '../../constants';
import type { Field } from './types';

export const fmtCoord = (value: number, positive: string, negative: string): string =>
  `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;

export const filterRows = (rows: PlaceRow[], query: string, categories: Set<string>, difficulties: Set<string>): PlaceRow[] => {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (row.boussole && !categories.has(row.boussole.category)) return false;
    const difficulty = row.boussole?.difficulty ?? row.indices?.difficulty;
    if (difficulty && !difficulties.has(difficulty)) return false;
    const country_ = countryFor(row.code);
    if (q && !row.name.toLowerCase().includes(q) && !country_.toLowerCase().includes(q) && !row.code.toLowerCase().includes(q)) return false;
    return true;
  });
};

export const INDICES_FIELD_BY_KEY: Record<string, Field> = {
  population: 'population',
  climateEmoji: 'climate',
  emojis: 'emojis',
};
