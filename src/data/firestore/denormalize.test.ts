import { countrySnapshot, planCountryChange } from './denormalize';
import type { CountryDoc, PlaceDoc } from './types';

const france: CountryDoc = {
  fr: 'France',
  en: 'France',
  flag: [{ id: 'blue', hex: '#0055A4', percent: 33 }],
  currency: 'Euro',
  currencySymbol: '€',
  phoneCode: '+33',
};

const place = (code: string, country?: PlaceDoc['country']): PlaceDoc => ({
  name: 'X',
  code,
  latitude: 0,
  longitude: 0,
  difficulty: 'easy',
  ...(country && { country }),
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

  it('ignores the fields a country document may still carry from before (outlines, neighbours...)', () => {
    const old = { ...france, ring: 'abc', difficulty: 'easy' } as CountryDoc;
    expect(countrySnapshot(old)).toEqual(countrySnapshot(france));
  });
});

describe('planCountryChange', () => {
  const renamed = { ...france, fr: 'République française' };
  const places = { a: place('FR', countrySnapshot(france)), b: place('ES', countrySnapshot(france)), c: place('FR') };

  it('rewrites the places of the country, only when their copy differs', () => {
    const plan = planCountryChange('FR', renamed, { ...places, d: place('FR', countrySnapshot(renamed)) });

    expect(Object.keys(plan.places).sort()).toEqual(['a', 'c']);
    expect(plan.places.a.country).toEqual(countrySnapshot(renamed));
  });

  it('leaves the places of other countries alone', () => {
    expect(planCountryChange('FR', renamed, places).places.b).toBeUndefined();
  });
});
