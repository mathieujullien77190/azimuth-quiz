import { countrySnapshot, planCountryChange } from './denormalize';
import type { CountryDoc, CountryNeighborDoc, PlaceDoc } from './types';

const france: CountryDoc = {
  fr: 'France',
  en: 'France',
  flag: [{ id: 'blue', hex: '#0055A4', percent: 33 }],
  currency: 'Euro',
  currencySymbol: '€',
  phoneCode: '+33',
  borders: ['ES'],
};

const place = (code: string, country?: PlaceDoc['country']): PlaceDoc => ({
  name: 'X',
  code,
  latitude: 0,
  longitude: 0,
  difficulty: 'easy',
  ...(country && { country }),
});

const country = (fr: string, neighbors?: CountryNeighborDoc[]): CountryDoc => ({
  fr,
  en: fr,
  ...(neighbors && { neighbors }),
});

describe('countrySnapshot', () => {
  it('copies what a place needs of its country, leaving absent fields absent', () => {
    expect(countrySnapshot(france)).toEqual({
      fr: 'France',
      en: 'France',
      flag: france.flag,
      currency: 'Euro',
      currencySymbol: '€',
      phoneCode: '+33',
    });
    expect(countrySnapshot({ fr: 'Ile', en: 'Isle' })).toEqual({ fr: 'Ile', en: 'Isle' });
  });
});

describe('planCountryChange', () => {
  const renamed = { ...france, fr: 'République française' };
  const places = { a: place('FR', countrySnapshot(france)), b: place('ES', countrySnapshot(france)), c: place('FR') };

  it('rewrites the places of the country, only when their copy differs', () => {
    const plan = planCountryChange('FR', renamed, { ...places, d: place('FR', countrySnapshot(renamed)) }, {});

    expect(Object.keys(plan.places).sort()).toEqual(['a', 'c']);
    expect(plan.places.a.country).toEqual(countrySnapshot(renamed));
    expect(plan.countries).toEqual({});
  });

  it('rewrites the names in every country document citing it as a neighbour, keeping the rest of the entry', () => {
    const cite = (fr: string, extra: Partial<CountryNeighborDoc> = {}): CountryNeighborDoc => ({
      code: 'FR',
      fr,
      en: fr,
      ...extra,
    });
    const countries = {
      FR: country('France', [{ code: 'ES', fr: 'Espagne', en: 'Spain' }]),
      ES: country('Espagne', [
        cite('France', { ring: 'abc', x: 0.1, y: 0.2 }),
        { code: 'PT', fr: 'Portugal', en: 'Portugal' },
      ]),
      IT: country('Italie', [{ ...cite('République française'), en: 'France' }]),
      DE: country('Allemagne'),
    };

    const plan = planCountryChange('FR', renamed, {}, countries);

    // FR itself is written by the caller; IT already carries the new names; DE cites nobody.
    expect(Object.keys(plan.countries)).toEqual(['ES']);
    expect(plan.countries.ES.neighbors).toEqual([
      { code: 'FR', fr: 'République française', en: 'France', ring: 'abc', x: 0.1, y: 0.2 },
      { code: 'PT', fr: 'Portugal', en: 'Portugal' },
    ]);
    expect(plan.countries.ES.fr).toBe('Espagne');
  });

  it('does nothing when nothing a copy carries changed', () => {
    expect(planCountryChange('FR', france, { a: places.a }, { FR: country('France') })).toEqual({
      places: {},
      countries: {},
    });
  });
});
