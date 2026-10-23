import type { CountryDoc, CountrySnapshot, PlaceDoc } from './types';
import { sameJson } from './same';

/** Le pays est copie dans chaque lieu (`PlaceDoc.country`) : l'admin reecrit les copies dans le meme lot. Pur : planifie seulement. */

/** Partie du pays portee par les lieux. Un champ absent reste absent (Firestore refuse `undefined`). */
export const countrySnapshot = (country: CountryDoc): CountrySnapshot => ({
  fr: country.fr,
  en: country.en,
  ...(country.flag && { flag: country.flag }),
  ...(country.currency !== undefined && { currency: country.currency }),
  ...(country.currencySymbol !== undefined && { currencySymbol: country.currencySymbol }),
  ...(country.phoneCode !== undefined && { phoneCode: country.phoneCode }),
});

/** Lieux du pays a reecrire avec la nouvelle copie, ceux qui different seulement. */
export type CountryChange = { places: Record<string, PlaceDoc> };

/** Tout ce qu'il faut reecrire avec `countries/{code}` quand il devient `next`. */
export const planCountryChange = (code: string, next: CountryDoc, places: Record<string, PlaceDoc>): CountryChange => {
  const snapshot = countrySnapshot(next);
  const changed: CountryChange = { places: {} };
  for (const [key, place] of Object.entries(places)) {
    if (place.code === code && !sameJson(place.country, snapshot))
      changed.places[key] = { ...place, country: snapshot };
  }
  return changed;
};
