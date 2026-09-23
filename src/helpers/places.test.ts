import type { GameSettings, Place } from '@/types';

import { filterPlaces, pickPlaces } from './places';

// Le factory de jest.mock ne peut pas referencer de variables externes (hoiste au-dessus des
// imports par Babel) : les lieux factices sont donc des litteraux inline ici...
jest.mock('@/constants', () => {
  const actual = jest.requireActual('@/constants');
  return {
    ...actual,
    PLACES: [
      { name: 'Paris', code: 'FR', coordinates: { latitude: 48.8566, longitude: 2.3522 }, category: 'cities', difficulty: 'easy' },
      { name: 'Berlin', code: 'DE', coordinates: { latitude: 52.52, longitude: 13.405 }, category: 'cities', difficulty: 'easy' },
      // Russie : dans EUROPE_CODES mais hors bornes de longitude (>45) -> exclue de la zone Europe.
      { name: 'Vladivostok', code: 'RU', coordinates: { latitude: 43.1, longitude: 131.9 }, category: 'cities', difficulty: 'hard' },
      { name: 'Tokyo', code: 'JP', coordinates: { latitude: 35.6762, longitude: 139.6503 }, category: 'landmarks', difficulty: 'master' },
      // A moins de MIN_PLACE_DISTANCE_KM (150km) de Paris.
      { name: 'Rouen', code: 'FR', coordinates: { latitude: 49.4431, longitude: 1.0993 }, category: 'mountains', difficulty: 'intermediate' },
    ],
  };
});

// ...et re-declares ici, en dehors du factory, pour les assertions (egalite structurelle, pas de reference).
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
    const result = filterPlaces(['cities'], ['easy'], 'world');
    expect(result).toEqual([paris, berlin]);
  });

  it('zone "france" keeps only code FR', () => {
    const result = filterPlaces(['cities', 'mountains', 'landmarks'], ['easy', 'intermediate', 'hard', 'master'], 'france');
    expect(result).toEqual([paris, rouen]);
  });

  it('zone "europe" excludes places past the longitude/latitude bounds even with an EUROPE_CODES code', () => {
    const result = filterPlaces(['cities', 'mountains', 'landmarks'], ['easy', 'intermediate', 'hard', 'master'], 'europe');
    expect(result).toEqual([paris, berlin, rouen]);
    expect(result).not.toContainEqual(vladivostok);
  });

  it('zone "world" keeps every code', () => {
    const result = filterPlaces(['cities', 'mountains', 'landmarks'], ['easy', 'intermediate', 'hard', 'master'], 'world');
    expect(result).toHaveLength(5);
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
    const picked = pickPlaces(paris.coordinates, baseSettings);
    expect(picked).not.toContainEqual(rouen);
  });

  it('caps the result at settings.rounds', () => {
    const picked = pickPlaces(paris.coordinates, { ...baseSettings, rounds: 2 });
    expect(picked).toHaveLength(2);
  });

  it('falls back to every candidate (including near ones) if none is far enough', () => {
    const picked = pickPlaces(paris.coordinates, {
      ...baseSettings,
      categories: ['mountains'],
      difficulties: ['intermediate'],
    });
    expect(picked).toEqual([rouen]);
  });
});
