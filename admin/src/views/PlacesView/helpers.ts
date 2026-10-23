import type { PlaceRow } from '../../api/places';

export const fmtCoord = (value: number, positive: string, negative: string): string =>
  `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;

export const filterRows = (rows: PlaceRow[], query: string, categories: Set<string>, difficulties: Set<string>): PlaceRow[] => {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (row.compass && !categories.has(row.compass.category)) return false;
    const difficulty = row.compass?.difficulty;
    if (difficulty && !difficulties.has(difficulty)) return false;
    if (q && !row.name.toLowerCase().includes(q) && !row.country.toLowerCase().includes(q) && !row.code.toLowerCase().includes(q)) return false;
    return true;
  });
};
