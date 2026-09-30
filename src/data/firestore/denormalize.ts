import type { ContourCountryDoc, CountryDoc, CountrySnapshot, PlaceDoc } from './types';
import { sameJson } from './same';

/**
 * The game never looks a country up: what it shows about a country is copied into each of its places
 * (`PlaceDoc.country`) and, for Silhouette, into each contour that cites it (`ContourNeighborDoc`,
 * `ContourCountryDoc.fr/en`). The price is paid when a country is edited: the admin rewrites the copies in
 * the same batch. Everything here is pure — it plans those rewrites, the admin writes them.
 */

/** The part of a country document that places carry. Absent fields stay absent (Firestore refuses undefined). */
export const countrySnapshot = (country: CountryDoc): CountrySnapshot => ({
  fr: country.fr,
  en: country.en,
  ...(country.flag && { flag: country.flag }),
  ...(country.currency !== undefined && { currency: country.currency }),
  ...(country.currencySymbol !== undefined && { currencySymbol: country.currencySymbol }),
  ...(country.phoneCode !== undefined && { phoneCode: country.phoneCode }),
});

/** Keys of the places whose `country` is missing or out of date with their country's document (a place
 * whose country has no document cannot get a copy, it is left alone). */
export const placesNeedingCountry = (
  places: Record<string, PlaceDoc>,
  countries: Record<string, CountryDoc>,
): string[] =>
  Object.entries(places)
    .filter(([, place]) => countries[place.code] && !sameJson(place.country, countrySnapshot(countries[place.code])))
    .map(([key]) => key);

export type CountryChange = {
  /** Places of the country, rewritten with the new copy — only those that differ. */
  places: Record<string, PlaceDoc>;
  /** Contours to rewrite: the country's own (its names) and every one that cites it as a neighbor. */
  contours: Record<string, ContourCountryDoc>;
};

/** Everything that must be rewritten along with `countries/{code}` when it becomes `next`. */
export const planCountryChange = (
  code: string,
  next: CountryDoc,
  places: Record<string, PlaceDoc>,
  contours: Record<string, ContourCountryDoc>,
): CountryChange => {
  const snapshot = countrySnapshot(next);
  const changed: CountryChange = { places: {}, contours: {} };
  for (const [key, place] of Object.entries(places)) {
    if (place.code === code && !sameJson(place.country, snapshot))
      changed.places[key] = { ...place, country: snapshot };
  }
  for (const [contourCode, contour] of Object.entries(contours)) {
    const own = contourCode === code && (contour.fr !== next.fr || contour.en !== next.en);
    const cites = contour.neighbors.some(
      (neighbor) => neighbor.code === code && (neighbor.fr !== next.fr || neighbor.en !== next.en),
    );
    if (!own && !cites) continue;
    changed.contours[contourCode] = {
      ...contour,
      ...(own && { fr: next.fr, en: next.en }),
      neighbors: contour.neighbors.map((neighbor) =>
        neighbor.code === code ? { ...neighbor, fr: next.fr, en: next.en } : neighbor,
      ),
    };
  }
  return changed;
};
