import { encodeRing } from './polyline';
import { unflattenPoints } from './read';
import type { ContourCountryDoc, CountryDoc, CountryNeighborDoc } from './types';

/**
 * TEMPORARY — the one-off merge of the `contours/{code}` collection into `countries/{code}`: everything below goes
 * away with the collection once the merge has run. Pure: the admin computes the fields, then writes them.
 */

/** A silhouette's outline as an encoded polyline, whichever form its old document has. */
const ringOf = (doc: ContourCountryDoc): string => doc.ring ?? encodeRing(unflattenPoints(doc.points));

/** The fields a country document gets when it carries a silhouette. */
export type CountryContourFields = Required<Pick<CountryDoc, 'ring' | 'difficulty' | 'centerLabel' | 'neighbors'>> &
  Pick<CountryDoc, 'capital' | 'cities' | 'n'>;

/**
 * The silhouette of `contour` as fields of its country document. The two neighbour lists of the old document
 * become ONE (`neighbors`): a country sharing a land border (`borderCodes`) with a silhouette of its own carries its
 * outline (`ring`, the backdrop), a hinted one (`contour.neighbors`) keeps its position (`x`/`y`). Names come from
 * the hint when there is one, else from the neighbour's country document.
 */
export const countryContourFields = (
  contour: ContourCountryDoc,
  contours: Record<string, ContourCountryDoc>,
  countries: Record<string, CountryDoc>,
): CountryContourFields => {
  const hints = new Map(contour.neighbors.map((neighbor) => [neighbor.code, neighbor]));
  const borders = new Set(contour.borderCodes);
  const codes = [...hints.keys(), ...contour.borderCodes.filter((code) => !hints.has(code)).sort()];
  const neighbors: CountryNeighborDoc[] = codes.map((code) => {
    const hint = hints.get(code);
    const other = contours[code];
    return {
      code,
      fr: hint?.fr ?? countries[code]?.fr ?? code,
      en: hint?.en ?? countries[code]?.en ?? code,
      ...(borders.has(code) && other && { ring: ringOf(other) }),
      ...(hint && { x: hint.x, y: hint.y }),
    };
  });
  return {
    ring: ringOf(contour),
    difficulty: contour.difficulty,
    centerLabel: contour.centerLabel,
    neighbors,
    ...(contour.capital && { capital: contour.capital }),
    ...(contour.cities && { cities: contour.cities }),
    ...(contour.n !== undefined && { n: contour.n }),
  };
};

/** The silhouettes whose country document does not carry them yet. */
export const contoursToMerge = (
  contours: Record<string, ContourCountryDoc>,
  countries: Record<string, CountryDoc>,
): string[] =>
  Object.keys(contours).filter((code) => countries[code] !== undefined && countries[code].ring === undefined);
