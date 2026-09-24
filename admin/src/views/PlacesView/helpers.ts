import type { PlaceRow } from '../../api/places';
import { countryFor } from '../../constants';
import type { Field, SortKey } from './types';

export const fmtCoord = (value: number, positive: string, negative: string): string =>
  `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;

const collator = new Intl.Collator('fr');

const sortValue = (row: PlaceRow, key: SortKey): string | number => {
  switch (key) {
    case 'countryName':
      return countryFor(row.code);
    case 'code':
      return row.code;
    case 'lat':
      return row.coordinates.latitude;
    case 'lon':
      return row.coordinates.longitude;
    default:
      return row.name;
  }
};

export const sortRows = (rows: PlaceRow[], key: SortKey, dir: 1 | -1): PlaceRow[] =>
  [...rows].sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : collator.compare(String(av), String(bv));
    return cmp * dir;
  });

export const filterRows = (
  rows: PlaceRow[],
  query: string,
  categories: Set<string>,
  boussoleDifficulties: Set<string>,
  indicesDifficulties: Set<string>,
  country: string,
): PlaceRow[] => {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (row.boussole && !categories.has(row.boussole.category)) return false;
    if (row.boussole && !boussoleDifficulties.has(row.boussole.difficulty)) return false;
    if (row.indices && !indicesDifficulties.has(row.indices.difficulty)) return false;
    const country_ = countryFor(row.code);
    if (country && country_ !== country) return false;
    if (q && !row.name.toLowerCase().includes(q) && !country_.toLowerCase().includes(q) && !row.code.toLowerCase().includes(q)) return false;
    return true;
  });
};

export const INDICES_FIELD_BY_KEY: Record<string, Field> = {
  difficulty: 'difficulty-indices',
  positionInCountry: 'position',
  population: 'population',
  climateEmoji: 'climate',
  elevationMeters: 'elevation',
  timezone: 'timezone',
  airportCode: 'airport',
  emojis: 'emojis',
};
