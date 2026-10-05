import type { PlaceRow } from '../../api/places';
import type { Field } from './types';

export const fmtCoord = (value: number, positive: string, negative: string): string =>
  `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;

export const filterRows = (rows: PlaceRow[], query: string, categories: Set<string>, difficulties: Set<string>): PlaceRow[] => {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (row.compass && !categories.has(row.compass.category)) return false;
    const difficulty = row.compass?.difficulty ?? row.clues?.difficulty;
    if (difficulty && !difficulties.has(difficulty)) return false;
    if (q && !row.name.toLowerCase().includes(q) && !row.country.toLowerCase().includes(q) && !row.code.toLowerCase().includes(q)) return false;
    return true;
  });
};

export const CLUE_FIELD_BY_KEY: Record<string, Field> = {
  population: 'population',
  climateEmoji: 'climate',
  emojis: 'emojis',
};
