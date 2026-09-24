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
      { name: 'Tokyo', code: 'JP', coordinates: { latitude: 35.6762, longitude: 139.6503 }, category: 'landmarks', difficulty: 'hard' },
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
const rouen: Place = {
  name: 'Rouen',
  code: 'FR',
  coordinates: { latitude: 49.4431, longitude: 1.0993 },
  category: 'mountains',
  difficulty: 'intermediate',
};

describe('filterPlaces', () => {
  it('keeps only matching categories and difficulties', () => {
    const result = filterPlaces(['cities'], ['easy'], 'fr');
    expect(result).toEqual([paris, berlin]);
  });

  it('matches across every country when several categories/difficulties are selected', () => {
    const result = filterPlaces(['cities', 'mountains', 'landmarks'], ['easy', 'intermediate', 'hard'], 'fr');
    expect(result).toHaveLength(4);
  });

  it('in English, a French place only matches the difficulty filter one tier up', () => {
    // Paris is 'easy': in English it behaves as 'intermediate', so an 'easy'-only filter drops it...
    expect(filterPlaces(['cities'], ['easy'], 'en')).not.toContainEqual(paris);
    // ...while an 'intermediate'-only filter picks it up.
    expect(filterPlaces(['cities'], ['intermediate'], 'en')).toContainEqual(paris);
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

  it('caps at "hard" instead of overflowing', () => {
    expect(effectiveDifficulty({ code: 'FR', difficulty: 'hard' }, 'en')).toBe('hard');
  });
});

describe('pickPlaces', () => {
  const baseSettings: GameSettings = {
    playerNames: [''],
    categories: ['cities', 'mountains', 'landmarks'],
    difficulties: ['easy', 'intermediate', 'hard'],
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
