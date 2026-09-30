import { countrySnapshot, placesNeedingCountry, planCountryChange } from './denormalize';
import type { ContourCountryDoc, CountryDoc, PlaceDoc } from './types';

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

const contour = (fr: string, neighbors: ContourCountryDoc['neighbors'] = []): ContourCountryDoc => ({
  fr,
  en: fr,
  points: [],
  difficulty: 'easy',
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors,
  borderCodes: [],
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

describe('placesNeedingCountry', () => {
  it('lists the places with no copy or an outdated one, and skips a country without document', () => {
    const places = {
      none: place('FR'),
      stale: place('FR', { fr: 'Franc', en: 'France' }),
      fresh: place('FR', countrySnapshot(france)),
      orphan: place('ZZ'),
    };

    expect(placesNeedingCountry(places, { FR: france })).toEqual(['none', 'stale']);
  });
});

describe('planCountryChange', () => {
  const renamed = { ...france, fr: 'République française' };
  const places = { a: place('FR', countrySnapshot(france)), b: place('ES', countrySnapshot(france)), c: place('FR') };

  it('rewrites the places of the country, only when their copy differs', () => {
    const plan = planCountryChange('FR', renamed, { ...places, d: place('FR', countrySnapshot(renamed)) }, {});

    expect(Object.keys(plan.places).sort()).toEqual(['a', 'c']);
    expect(plan.places.a.country).toEqual(countrySnapshot(renamed));
    expect(plan.contours).toEqual({});
  });

  it('rewrites the contour of the country and every contour citing it as a neighbor', () => {
    const cite = (fr: string) => ({ type: 'country' as const, code: 'FR', x: 0, y: 0, fr, en: fr });
    const contours = {
      FR: contour('France'),
      ES: contour('Espagne', [
        cite('France'),
        { type: 'country' as const, code: 'PT', x: 0, y: 0, fr: 'Portugal', en: 'Portugal' },
      ]),
      IT: contour('Italie', [{ ...cite('République française'), en: 'France' }]),
      DE: contour('Allemagne'),
    };

    const plan = planCountryChange('FR', renamed, {}, contours);

    expect(Object.keys(plan.contours).sort()).toEqual(['ES', 'FR']);
    expect(plan.contours.FR).toMatchObject({ fr: 'République française', en: 'France' });
    expect(plan.contours.ES.neighbors.map((neighbor) => neighbor.fr)).toEqual(['République française', 'Portugal']);
    expect(plan.contours.ES.fr).toBe('Espagne');
  });

  it('does nothing when nothing a copy carries changed', () => {
    expect(planCountryChange('FR', france, { a: places.a }, { FR: contour('France') })).toEqual({
      places: {},
      contours: {},
    });
  });
});
