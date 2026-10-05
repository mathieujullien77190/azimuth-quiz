import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CountryDoc } from '@/data/firestore/types';

const h = vi.hoisted(() => ({
  state: { countries: {} as Record<string, unknown> },
  applyCountryChange: undefined as unknown as (code: string, doc: unknown) => Promise<void>,
}));

vi.mock('../data', () => ({
  data: () => h.state,
  applyCountryChange: (code: string, doc: unknown) => h.applyCountryChange(code, doc),
}));

import { fetchCountries, saveCountry, type CountryRecord } from './countries';

const full: CountryDoc = {
  fr: 'France',
  en: 'France',
  flag: [{ id: 'blue', hex: '#00f', percent: 33 }],
  currency: 'euro',
  currencySymbol: '€',
  phoneCode: '+33',
};

/** What a document written when Silhouette still existed carries on top of the country data. */
const withSilhouetteLeftovers = { ...full, borders: ['ES'], ring: 'abc', difficulty: 'easy', n: 3, neighbors: [] };

const recordOf = (overrides: Partial<CountryRecord> = {}): CountryRecord => ({
  code: 'FR',
  fr: 'France',
  en: 'France',
  flag: null,
  currency: null,
  currencySymbol: null,
  phoneCode: null,
  ...overrides,
});

beforeEach(() => {
  h.state.countries = {};
  h.applyCountryChange = vi.fn(async () => {});
});

describe('fetchCountries', () => {
  it('turns every document into a record, with the flag as tuples', async () => {
    h.state.countries = { FR: full };

    expect(await fetchCountries()).toEqual([
      {
        code: 'FR',
        fr: 'France',
        en: 'France',
        flag: [['blue', '#00f', 33]],
        currency: 'euro',
        currencySymbol: '€',
        phoneCode: '+33',
      },
    ]);
  });

  it('uses null for what a country does not have', async () => {
    h.state.countries = { MC: { fr: 'Monaco', en: 'Monaco' } };

    expect(await fetchCountries()).toEqual([recordOf({ code: 'MC', fr: 'Monaco', en: 'Monaco' })]);
  });

  it('does not read what Silhouette left on a document', async () => {
    h.state.countries = { FR: withSilhouetteLeftovers };

    expect(Object.keys((await fetchCountries())[0]).sort()).toEqual(
      ['code', 'currency', 'currencySymbol', 'en', 'flag', 'fr', 'phoneCode'],
    );
  });
});

describe('saveCountry', () => {
  it('writes the patched fields through applyCountryChange and returns the new record', async () => {
    h.state.countries = { FR: { fr: 'France', en: 'France', currency: 'old' } };
    const row = recordOf();

    const saved = await saveCountry(row, {
      fr: 'France 2',
      en: 'France 3',
      currency: 'euro',
      currencySymbol: '€',
      phoneCode: '+33',
      flag: [['red', '#f00', 50]],
    });

    expect(h.applyCountryChange).toHaveBeenCalledWith('FR', {
      fr: 'France 2',
      en: 'France 3',
      currency: 'euro',
      currencySymbol: '€',
      phoneCode: '+33',
      flag: [{ id: 'red', hex: '#f00', percent: 50 }],
    });
    expect(saved).toMatchObject({ fr: 'France 2', currency: 'euro' });
  });

  it('leaves the fields absent from the patch alone', async () => {
    h.state.countries = { FR: { ...full } };

    await saveCountry(recordOf(), {});

    expect(h.applyCountryChange).toHaveBeenCalledWith('FR', full);
  });

  it('writes back, untouched, whatever else the stored document carries (Silhouette left fields on it)', async () => {
    h.state.countries = { FR: { ...withSilhouetteLeftovers } };

    await saveCountry(recordOf(), { fr: 'La France' });

    expect(h.applyCountryChange).toHaveBeenCalledWith('FR', { ...withSilhouetteLeftovers, fr: 'La France' });
  });

  it('removes emptied optional fields and an empty flag', async () => {
    h.state.countries = { FR: { ...full } };

    await saveCountry(recordOf(), { currency: '', currencySymbol: null, phoneCode: '', flag: [] });

    const written = (h.applyCountryChange as ReturnType<typeof vi.fn>).mock.calls[0][1] as CountryDoc;
    expect(written).not.toHaveProperty('currency');
    expect(written).not.toHaveProperty('currencySymbol');
    expect(written).not.toHaveProperty('phoneCode');
    expect(written).not.toHaveProperty('flag');
  });

  it('removes the flag when the patch sets it to null', async () => {
    h.state.countries = { FR: { ...full } };

    await saveCountry(recordOf(), { flag: null });

    expect((h.applyCountryChange as ReturnType<typeof vi.fn>).mock.calls[0][1]).not.toHaveProperty('flag');
  });
});
