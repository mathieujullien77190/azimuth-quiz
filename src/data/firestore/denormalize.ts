import type { CountryDoc, CountrySnapshot, PlaceDoc } from './types';
import { sameJson } from './same';

/**
 * The game never looks a country up: what it shows about a country is copied into each of its places
 * (`PlaceDoc.country`). The price is paid when a country is edited: the admin rewrites the copies in the same batch.
 * Everything here is pure — it plans those rewrites, the admin writes them.
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

/** Places of the country, rewritten with the new copy — only those that differ. */
export type CountryChange = { places: Record<string, PlaceDoc> };

/** Everything that must be rewritten along with `countries/{code}` when it becomes `next`. */
export const planCountryChange = (code: string, next: CountryDoc, places: Record<string, PlaceDoc>): CountryChange => {
  const snapshot = countrySnapshot(next);
  const changed: CountryChange = { places: {} };
  for (const [key, place] of Object.entries(places)) {
    if (place.code === code && !sameJson(place.country, snapshot))
      changed.places[key] = { ...place, country: snapshot };
  }
  return changed;
};
