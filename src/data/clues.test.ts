import { countryFlagColors } from '@/data/places/countries';

import { CLUE_PLACES } from './clues';

describe('CLUE_PLACES', () => {
  it('is not empty', () => {
    expect(CLUE_PLACES.length).toBeGreaterThan(0);
  });

  it('has no duplicate (name, country) entries', () => {
    // Two real cities can legitimately share a name (e.g. Victoria, Canada / Seychelles):
    // only the name+country pair must be unique, not the name alone.
    const keys = CLUE_PLACES.map((place) => `${place.name}, ${place.country}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every place has a matching flag-colors entry for its country', () => {
    for (const place of CLUE_PLACES) {
      const colors = countryFlagColors(place.code);
      expect(colors).toBeDefined();
      expect(colors!.length).toBeGreaterThan(0);
    }
  });

  it('every place has exactly 3 emoji candidates', () => {
    for (const place of CLUE_PLACES) {
      expect(place.emojis).toHaveLength(3);
      for (const emoji of place.emojis) expect(typeof emoji).toBe('string');
    }
  });

  it('every place has valid coordinates', () => {
    for (const place of CLUE_PLACES) {
      expect(place.coordinates.latitude).toBeGreaterThanOrEqual(-90);
      expect(place.coordinates.latitude).toBeLessThanOrEqual(90);
      expect(place.coordinates.longitude).toBeGreaterThanOrEqual(-180);
      expect(place.coordinates.longitude).toBeLessThanOrEqual(180);
    }
  });
});
