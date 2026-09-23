import type { IndicesClueId } from '@/types';

import {
  DEFAULT_INDICES_SETTINGS,
  INDICES_ANSWER_METHODS,
  INDICES_BUZZER_MODES,
  INDICES_CLUE_ORDER,
  INDICES_FLAG_COLOR_FIELD,
  INDICES_FLAG_COLORS_BY_COUNTRY,
  INDICES_PLACES,
  indicesPlaceFromRow,
} from './indices';

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
    // Deux vraies villes peuvent legitimement partager un nom (ex. Victoria, Canada / Seychelles) :
    // seule la paire nom+pays doit etre unique, pas le nom seul.
    const keys = INDICES_PLACES.map((place) => `${place.name}, ${place.country}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every place has a matching flag-colors entry for its country', () => {
    for (const place of INDICES_PLACES) {
      expect(INDICES_FLAG_COLORS_BY_COUNTRY[place.country]).toBeDefined();
      expect(INDICES_FLAG_COLORS_BY_COUNTRY[place.country].length).toBeGreaterThan(0);
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

describe('indicesPlaceFromRow', () => {
  it('maps each tuple field to the correct named property', () => {
    const row = [
      'Testville',
      'Testland',
      1.5,
      -2.5,
      'easy',
      'ne',
      12345,
      '☀️',
      42,
      'Europe/Paris',
      '+33',
      '€',
      'TST',
      '🗼',
      '🎨',
      '🌳',
    ] as const;

    expect(indicesPlaceFromRow(row as never)).toEqual({
      name: 'Testville',
      country: 'Testland',
      coordinates: { latitude: 1.5, longitude: -2.5 },
      difficulty: 'easy',
      positionInCountry: 'ne',
      population: 12345,
      climateEmoji: '☀️',
      elevationMeters: 42,
      timezone: 'Europe/Paris',
      phoneCode: '+33',
      currency: '€',
      airportCode: 'TST',
      emojis: ['🗼', '🎨', '🌳'],
    });
  });
});

describe('INDICES_FLAG_COLORS_BY_COUNTRY', () => {
  it('every color row has a valid hex and a percent between 1 and 100', () => {
    for (const rows of Object.values(INDICES_FLAG_COLORS_BY_COUNTRY)) {
      for (const row of rows) {
        expect(row[INDICES_FLAG_COLOR_FIELD.HEX]).toMatch(/^#[0-9A-F]{6}$/);
        expect(row[INDICES_FLAG_COLOR_FIELD.PERCENT]).toBeGreaterThan(0);
        expect(row[INDICES_FLAG_COLOR_FIELD.PERCENT]).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('INDICES_CLUE_ORDER', () => {
  it('lists every clue id exactly once', () => {
    expect([...INDICES_CLUE_ORDER].sort()).toEqual([...ALL_CLUE_IDS].sort());
  });
});

describe('INDICES_BUZZER_MODES / INDICES_ANSWER_METHODS', () => {
  it('lists both buzzer modes', () => {
    expect(INDICES_BUZZER_MODES.map((mode) => mode.id).sort()).toEqual(['anyone', 'turnPlayer'].sort());
  });

  it('lists both answer methods', () => {
    expect(INDICES_ANSWER_METHODS.map((method) => method.id).sort()).toEqual(['spoken', 'typed'].sort());
  });
});

describe('DEFAULT_INDICES_SETTINGS', () => {
  it('is a valid, playable settings object', () => {
    expect(DEFAULT_INDICES_SETTINGS.playerNames.length).toBeGreaterThan(0);
    expect(DEFAULT_INDICES_SETTINGS.rounds).toBeGreaterThan(0);
    expect(['turnPlayer', 'anyone']).toContain(DEFAULT_INDICES_SETTINGS.buzzerMode);
    expect(['spoken', 'typed']).toContain(DEFAULT_INDICES_SETTINGS.answerMethod);
  });
});
