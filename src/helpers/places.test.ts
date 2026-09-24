import type { GameSettings, Place } from '@/types';

import { effectiveDifficulty, filterPlaces, pickPlaces } from './places';

// The jest.mock factory can't reference outside variables (hoisted above the
// imports by Babel): the fake places are therefore inline literals here...
jest.mock('@/constants', () => {
  const actual = jest.requireActual('@/constants');
  return {
    ...actual,
    PLACES: [
      { name: 'Paris', code: 'FR', coordinates: { latitude: 48.8566, longitude: 2.3522 }, category: 'cities', difficulty: 'easy' },
      { name: 'Berlin', code: 'DE', coordinates: { latitude: 52.52, longitude: 13.405 }, category: 'cities', difficulty: 'easy' },
      // Russia: in EUROPE_CODES but outside the longitude bounds (>45) -> excluded from the Europe zone.
      { name: 'Vladivostok', code: 'RU', coordinates: { latitude: 43.1, longitude: 131.9 }, category: 'cities', difficulty: 'hard' },
      { name: 'Tokyo', code: 'JP', coordinates: { latitude: 35.6762, longitude: 139.6503 }, category: 'landmarks', difficulty: 'master' },
      // Less than MIN_PLACE_DISTANCE_KM (150km) from Paris.
      { name: 'Rouen', code: 'FR', coordinates: { latitude: 49.4431, longitude: 1.0993 }, category: 'mountains', difficulty: 'intermediate' },
    ],
  };
});

// ...and re-declared here, outside the factory, for the assertions (structural equality, not reference).
const paris: Place = {
  name: 'Paris',
  code: 'FR',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
  category: 'cities',
  difficulty: 'easy',
};
const berlin: Place = {
  name: 'Berlin',
  code: 'DE',
  coordinates: { latitude: 52.52, longitude: 13.405 },
  category: 'cities',
  difficulty: 'easy',
};
const vladivostok: Place = {
  name: 'Vladivostok',
  code: 'RU',
  coordinates: { latitude: 43.1, longitude: 131.9 },
  category: 'cities',
  difficulty: 'hard',
};
const rouen: Place = {
  name: 'Rouen',
  code: 'FR',
  coordinates: { latitude: 49.4431, longitude: 1.0993 },
  category: 'mountains',
  difficulty: 'intermediate',
};

describe('filterPlaces', () => {
  it('keeps only matching categories and difficulties, any zone', () => {
    const result = filterPlaces(['cities'], ['easy'], 'world', 'fr');
    expect(result).toEqual([paris, berlin]);
  });

  it('zone "france" keeps only code FR', () => {
    const result = filterPlaces(['cities', 'mountains', 'landmarks'], ['easy', 'intermediate', 'hard', 'master'], 'france', 'fr');
    expect(result).toEqual([paris, rouen]);
  });

  it('zone "europe" excludes places past the longitude/latitude bounds even with an EUROPE_CODES code', () => {
    const result = filterPlaces(['cities', 'mountains', 'landmarks'], ['easy', 'intermediate', 'hard', 'master'], 'europe', 'fr');
    expect(result).toEqual([paris, berlin, rouen]);
    expect(result).not.toContainEqual(vladivostok);
  });

  it('zone "world" keeps every code', () => {
    const result = filterPlaces(['cities', 'mountains', 'landmarks'], ['easy', 'intermediate', 'hard', 'master'], 'world', 'fr');
    expect(result).toHaveLength(5);
  });

  it('in English, a French place only matches the difficulty filter one tier up', () => {
    // Paris is 'easy': in English it behaves as 'intermediate', so an 'easy'-only filter drops it...
    expect(filterPlaces(['cities'], ['easy'], 'world', 'en')).not.toContainEqual(paris);
    // ...while an 'intermediate'-only filter picks it up.
    expect(filterPlaces(['cities'], ['intermediate'], 'world', 'en')).toContainEqual(paris);
  });
});

describe('effectiveDifficulty', () => {
  it('leaves every place untouched in French', () => {
    expect(effectiveDifficulty(paris, 'fr')).toBe('easy');
  });

  it('leaves non-French places untouched even in English', () => {
    expect(effectiveDifficulty(berlin, 'en')).toBe('easy');
  });

  it('bumps a French place up one tier in English', () => {
    expect(effectiveDifficulty(paris, 'en')).toBe('intermediate');
    expect(effectiveDifficulty(rouen, 'en')).toBe('hard');
  });

  it('caps at "master" instead of overflowing', () => {
    expect(effectiveDifficulty({ code: 'FR', difficulty: 'master' }, 'en')).toBe('master');
  });
});

describe('pickPlaces', () => {
  const baseSettings: GameSettings = {
    playerNames: [''],
    categories: ['cities', 'mountains', 'landmarks'],
    difficulties: ['easy', 'intermediate', 'hard', 'master'],
    zone: 'world',
    rounds: 10,
    straightLine: false,
    useGps: false,
    customLatitude: 48.8566,
    customLongitude: 2.3522,
    liveCompass: false,
    showCountry: false,
    allowRevision: false,
    hideOtherAnswers: false,
  };

  it('excludes places closer than MIN_PLACE_DISTANCE_KM to the origin', () => {
    const picked = pickPlaces(paris.coordinates, baseSettings, 'fr');
    expect(picked).not.toContainEqual(rouen);
  });

  it('caps the result at settings.rounds', () => {
    const picked = pickPlaces(paris.coordinates, { ...baseSettings, rounds: 2 }, 'fr');
    expect(picked).toHaveLength(2);
  });

  it('falls back to every candidate (including near ones) if none is far enough', () => {
    const picked = pickPlaces(
      paris.coordinates,
      {
        ...baseSettings,
        categories: ['mountains'],
        difficulties: ['intermediate'],
      },
      'fr',
    );
    expect(picked).toEqual([rouen]);
  });
});
