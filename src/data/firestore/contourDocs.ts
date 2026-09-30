import { MAX_CITY_HINTS } from '@/games/contour/constants';
import type { Difficulty } from '@/types';

import { shuffleRank } from './numbering';
import type { ContourCountryDoc, ContourCounts, ContourPlaceDoc, CountryDoc, PlaceDoc } from './types';

/**
 * `contours/{code}`: one document per silhouette with everything a Silhouette round needs (see
 * `ContourCountryDoc`). Built once — by the admin's migration, from the countries' embedded `contour` and
 * the places — instead of at every round on every device. Pure.
 */

const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, intermediate: 1, hard: 2 };

// Same defaults as `data/contours/codec.ts` for a contour that doesn't say.
const DEFAULT_CENTER_LABEL = { x: 0.5, y: 0.5 };
const DEFAULT_DIFFICULTY: Difficulty = 'intermediate';

/** The capital and the cities (capital excluded, at most `MAX_CITY_HINTS`) of the country of `points`
 * (flat ring), from the Compass places inside the bounding box of that ring — which leaves out overseas
 * territories. Same choice the game made at every round (`contourPlacesFor`): the best-known cities first
 * (easy, then intermediate, then hard), ties in the order of `places`. */
export const contourPlaceDocs = (
  code: string,
  points: readonly number[],
  places: readonly PlaceDoc[],
): { capital?: ContourPlaceDoc; cities?: ContourPlaceDoc[] } => {
  const lons = points.filter((_, index) => index % 2 === 0);
  const lats = points.filter((_, index) => index % 2 === 1);
  const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];

  const inside = places.filter(
    (place) =>
      place.compass &&
      place.code === code &&
      place.longitude >= minLon &&
      place.longitude <= maxLon &&
      place.latitude >= minLat &&
      place.latitude <= maxLat,
  );
  const toDoc = (place: PlaceDoc): ContourPlaceDoc => ({ name: place.name, lon: place.longitude, lat: place.latitude });

  const capital = inside.find((place) => place.compass!.category === 'capital');
  const seen = new Set<string>(capital ? [capital.name] : []);
  const cities = inside
    .filter((place) => place.compass!.category === 'cities' || place.compass!.category === 'citiesFr')
    .filter((place) => !seen.has(place.name) && seen.add(place.name))
    .sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty])
    .slice(0, MAX_CITY_HINTS)
    .map(toDoc);

  return { ...(capital && { capital: toDoc(capital) }), ...(cities.length > 0 && { cities }) };
};

/** Numbers the contours inside their difficulty group, 1..size, in the shuffled order of `shuffleRank`
 * (a group that already is exactly 1..size keeps its numbers unless `force`). */
export const computeContourNumbering = (
  entries: [string, Pick<ContourCountryDoc, 'difficulty' | 'n'>][],
  { force = false }: { force?: boolean } = {},
): { numbers: Record<string, number>; counts: ContourCounts } => {
  const numbers: Record<string, number> = {};
  const counts: ContourCounts = {};
  for (const difficulty of ['easy', 'intermediate', 'hard'] as Difficulty[]) {
    const group = entries.filter(([, contour]) => contour.difficulty === difficulty);
    if (group.length === 0) continue;
    counts[difficulty] = group.length;
    const dense = group
      .map(([, contour]) => contour.n ?? 0)
      .sort((a, b) => a - b)
      .every((n, index) => n === index + 1);
    if (dense && !force) group.forEach(([code, contour]) => (numbers[code] = contour.n!));
    else
      [...group]
        .sort(([a], [b]) => shuffleRank(a) - shuffleRank(b))
        .forEach(([code], index) => (numbers[code] = index + 1));
  }
  return { numbers, counts };
};

const countsKey = (counts: ContourCounts): string =>
  JSON.stringify(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));

/** True when every contour has an `n` and `counts` is exactly their numbering. */
export const isContourNumberingConsistent = (
  contours: Record<string, ContourCountryDoc>,
  counts: ContourCounts | undefined,
): boolean => {
  const { numbers, counts: expected } = computeContourNumbering(Object.entries(contours));
  return (
    Object.entries(contours).every(([code, contour]) => contour.n === numbers[code]) &&
    countsKey(expected) === countsKey(counts ?? {})
  );
};

/**
 * Every `contours/{code}` document, from the countries that carry an embedded `contour` (the state before
 * the migration) and the places (`places` in the order that breaks ties between cities of the same
 * difficulty). Names of the country and of its neighbors are copied in; the numbering is the shuffled one.
 */
export const buildContourDocs = (
  countries: Record<string, CountryDoc>,
  places: readonly PlaceDoc[],
): { docs: Record<string, ContourCountryDoc>; counts: ContourCounts } => {
  const docs: Record<string, ContourCountryDoc> = {};
  for (const [code, country] of Object.entries(countries)) {
    const { contour } = country;
    if (!contour) continue;
    docs[code] = {
      fr: country.fr,
      en: country.en,
      points: contour.points,
      difficulty: contour.difficulty ?? DEFAULT_DIFFICULTY,
      centerLabel: contour.centerLabel ?? DEFAULT_CENTER_LABEL,
      neighbors: (contour.neighbors ?? []).map((neighbor) => ({
        ...neighbor,
        fr: countries[neighbor.code]?.fr ?? neighbor.code,
        en: countries[neighbor.code]?.en ?? neighbor.code,
      })),
      borderCodes: country.borders ?? [],
      ...contourPlaceDocs(code, contour.points, places),
    };
  }
  const { numbers, counts } = computeContourNumbering(Object.entries(docs), { force: true });
  for (const [code, n] of Object.entries(numbers)) docs[code].n = n;
  return { docs, counts };
};
