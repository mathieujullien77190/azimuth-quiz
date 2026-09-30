import type { CountryDoc, CountrySnapshot, PlaceDoc } from './types';
import { sameJson } from './same';

/**
 * The game never looks a country up: what it shows about a country is copied into each of its places
 * (`PlaceDoc.country`) and, for Silhouette, into each country document that cites it as a neighbour
 * (`CountryNeighborDoc.fr/en`). The price is paid when a country is edited: the admin rewrites the copies in
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

export type CountryChange = {
  /** Places of the country, rewritten with the new copy — only those that differ. */
  places: Record<string, PlaceDoc>;
  /** Other countries to rewrite: every one that cites it as a neighbour (the country's own document is
   * `next` itself, written by the caller). */
  countries: Record<string, CountryDoc>;
};

/** Everything that must be rewritten along with `countries/{code}` when it becomes `next`. */
export const planCountryChange = (
  code: string,
  next: CountryDoc,
  places: Record<string, PlaceDoc>,
  countries: Record<string, CountryDoc>,
): CountryChange => {
  const snapshot = countrySnapshot(next);
  const changed: CountryChange = { places: {}, countries: {} };
  for (const [key, place] of Object.entries(places)) {
    if (place.code === code && !sameJson(place.country, snapshot))
      changed.places[key] = { ...place, country: snapshot };
  }
  for (const [otherCode, other] of Object.entries(countries)) {
    const neighbors = other.neighbors ?? [];
    const cites = neighbors.some(
      (neighbor) => neighbor.code === code && (neighbor.fr !== next.fr || neighbor.en !== next.en),
    );
    if (otherCode === code || !cites) continue;
    changed.countries[otherCode] = {
      ...other,
      neighbors: neighbors.map((neighbor) =>
        neighbor.code === code ? { ...neighbor, fr: next.fr, en: next.en } : neighbor,
      ),
    };
  }
  return changed;
};
