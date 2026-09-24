import { countryFlagColors } from '@/constants/places/countries';
import type { IndicesClueId } from '@/types';

import { DEFAULT_INDICES_SETTINGS, INDICES_ANSWER_METHODS, INDICES_CLUE_ORDER, INDICES_PLACES } from './indices';

const ALL_CLUE_IDS: IndicesClueId[] = [
  'position',
  'population',
  'climate',
  'emoji',
  'elevation',
  'letterCount',
  'wordCount',
  'flagColors',
  'bearing',
  'distance',
  'localTime',
  'phoneCode',
  'currency',
  'airportCode',
  'firstLetter',
];

describe('INDICES_PLACES', () => {
  it('is not empty', () => {
    expect(INDICES_PLACES.length).toBeGreaterThan(0);
  });

  it('has no duplicate (name, country) entries', () => {
    // Two real cities can legitimately share a name (e.g. Victoria, Canada / Seychelles):
    // only the name+country pair must be unique, not the name alone.
    const keys = INDICES_PLACES.map((place) => `${place.name}, ${place.country}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every place has a matching flag-colors entry for its country', () => {
    for (const place of INDICES_PLACES) {
      const colors = countryFlagColors(place.code);
      expect(colors).toBeDefined();
      expect(colors!.length).toBeGreaterThan(0);
    }
  });

  it('every place has exactly 3 emoji candidates', () => {
    for (const place of INDICES_PLACES) {
      expect(place.emojis).toHaveLength(3);
      for (const emoji of place.emojis) expect(typeof emoji).toBe('string');
    }
  });

  it('every place has valid coordinates', () => {
    for (const place of INDICES_PLACES) {
      expect(place.coordinates.latitude).toBeGreaterThanOrEqual(-90);
      expect(place.coordinates.latitude).toBeLessThanOrEqual(90);
      expect(place.coordinates.longitude).toBeGreaterThanOrEqual(-180);
      expect(place.coordinates.longitude).toBeLessThanOrEqual(180);
    }
  });
});

describe('INDICES_CLUE_ORDER', () => {
  it('lists every clue id exactly once', () => {
    expect([...INDICES_CLUE_ORDER].sort()).toEqual([...ALL_CLUE_IDS].sort());
  });
});

describe('INDICES_ANSWER_METHODS', () => {
  it('lists both answer methods', () => {
    expect(INDICES_ANSWER_METHODS.map((method) => method.id).sort()).toEqual(['spoken', 'typed'].sort());
  });
});

describe('DEFAULT_INDICES_SETTINGS', () => {
  it('is a valid, playable settings object', () => {
    expect(DEFAULT_INDICES_SETTINGS.playerNames.length).toBeGreaterThan(0);
    expect(DEFAULT_INDICES_SETTINGS.rounds).toBeGreaterThan(0);
    expect(['spoken', 'typed']).toContain(DEFAULT_INDICES_SETTINGS.answerMethod);
  });
});
