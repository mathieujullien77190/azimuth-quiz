import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CountryDoc } from '@/data/firestore/types';

const h = vi.hoisted(() => ({
  state: { countries: {} as Record<string, unknown> },
  applyCountryChange: undefined as unknown as (code: string, doc: unknown) => Promise<void>,
  applyContourDifficultyChange: undefined as unknown as (code: string, difficulty: string) => Promise<void>,
}));

vi.mock('../data', () => ({
  data: () => h.state,
  applyCountryChange: (code: string, doc: unknown) => h.applyCountryChange(code, doc),
  applyContourDifficultyChange: (code: string, difficulty: string) => h.applyContourDifficultyChange(code, difficulty),
}));

import { fetchCountries, saveContourDifficulty, saveCountry, type CountryRecord } from './countries';

const full: CountryDoc = {
  fr: 'France',
  en: 'France',
  flag: [{ id: 'blue', hex: '#00f', percent: 33 }],
  currency: 'euro',
  currencySymbol: '€',
  phoneCode: '+33',
  borders: ['ES'],
  ring: 'abc',
  difficulty: 'easy',
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors: [],
};

const recordOf = (overrides: Partial<CountryRecord> = {}): CountryRecord => ({
  code: 'FR',
  fr: 'France',
  en: 'France',
  flag: null,
  currency: null,
  currencySymbol: null,
  phoneCode: null,
  neighbors: [],
  difficulty: null,
  ...overrides,
});

beforeEach(() => {
  h.state.countries = {};
  h.applyCountryChange = vi.fn(async () => {});
  h.applyContourDifficultyChange = vi.fn(async () => {});
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
        neighbors: ['ES'],
        difficulty: 'easy',
      },
    ]);
  });

  it('uses null and an empty list for what a country does not have', async () => {
    h.state.countries = { MC: { fr: 'Monaco', en: 'Monaco' } };

    expect(await fetchCountries()).toEqual([recordOf({ code: 'MC', fr: 'Monaco', en: 'Monaco' })]);
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

describe('saveContourDifficulty', () => {
  it('delegates to applyContourDifficultyChange and returns the record with the new difficulty', async () => {
    const saved = await saveContourDifficulty(recordOf({ difficulty: 'easy' }), 'hard');

    expect(h.applyContourDifficultyChange).toHaveBeenCalledWith('FR', 'hard');
    expect(saved.difficulty).toBe('hard');
  });
});
