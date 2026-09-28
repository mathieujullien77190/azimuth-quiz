import { CONTOURS, PLACES } from '@/data';
import { MAX_CITY_HINTS } from '@/games/contour/constants';
import type { Category, ContourCountry, Difficulty, Place } from '@/types';

import { contourPlacesFor } from './contourPlaces';

const square: ContourCountry = {
  code: 'AA',
  points: [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ],
  neighbors: [],
  centerLabel: { x: 0.5, y: 0.5 },
  difficulty: 'easy',
};

const place = (
  name: string,
  category: Category,
  difficulty: Difficulty,
  longitude: number,
  latitude: number,
  code = 'AA',
): Place => ({ name, code, category, difficulty, coordinates: { latitude, longitude } });

describe('contourPlacesFor', () => {
  it('splits the capital from the cities of the country, with their positions', () => {
    const { capital, cities } = contourPlacesFor(square, [
      place('Capitale', 'capital', 'easy', 5, 5),
      place('Ville', 'cities', 'easy', 2, 3),
    ]);
    expect(capital).toEqual({ name: 'Capitale', longitude: 5, latitude: 5 });
    expect(cities).toEqual([{ name: 'Ville', longitude: 2, latitude: 3 }]);
  });

  it('keeps the French cities too, never the mountains or landmarks, never the capital as a city', () => {
    const { cities } = contourPlacesFor(square, [
      place('Capitale', 'capital', 'easy', 5, 5),
      place('Capitale', 'cities', 'easy', 5, 5),
      place('Lyon', 'citiesFr', 'easy', 1, 1),
      place('Sommet', 'mountains', 'easy', 2, 2),
      place('Tour', 'landmarks', 'easy', 3, 3),
    ]);
    expect(cities.map((city) => city.name)).toEqual(['Lyon']);
  });

  it('leaves out the other countries and what lies outside the main ring (overseas)', () => {
    const { capital, cities } = contourPlacesFor(square, [
      place('Ailleurs', 'cities', 'easy', 5, 5, 'BB'),
      place('Outre-mer', 'cities', 'easy', -60, 5),
      place('Nord', 'cities', 'easy', 5, 40),
      place('Capitale lointaine', 'capital', 'easy', 50, 50),
      place('Dedans', 'cities', 'easy', 9, 9),
    ]);
    expect(capital).toBeNull();
    expect(cities.map((city) => city.name)).toEqual(['Dedans']);
  });

  it('takes the best-known cities first, ties in data order, at most MAX_CITY_HINTS, without duplicates', () => {
    const { cities } = contourPlacesFor(square, [
      place('Dure', 'cities', 'hard', 1, 1),
      place('Moyenne', 'cities', 'intermediate', 2, 2),
      place('Facile 1', 'cities', 'easy', 3, 3),
      place('Facile 1', 'citiesFr', 'easy', 3, 3),
      place('Facile 2', 'cities', 'easy', 4, 4),
      place('Moyenne 2', 'cities', 'intermediate', 5, 5),
      place('Facile 3', 'cities', 'easy', 6, 6),
    ]);
    expect(cities.map((city) => city.name)).toEqual(['Facile 1', 'Facile 2', 'Facile 3', 'Moyenne', 'Moyenne 2']);
    expect(cities).toHaveLength(MAX_CITY_HINTS);
  });

  it('offers nothing for a country without any place', () => {
    expect(contourPlacesFor(square, [])).toEqual({ capital: null, cities: [] });
  });

  it('finds the real capital and up to five real cities of France, all inside its ring', () => {
    const france = CONTOURS.find((country) => country.code === 'FR')!;
    const { capital, cities } = contourPlacesFor(france);
    expect(capital?.name).toBe('Paris');
    expect(cities.length).toBeGreaterThan(0);
    expect(cities.length).toBeLessThanOrEqual(MAX_CITY_HINTS);
    expect(cities.map((city) => city.name)).not.toContain('Paris');
    expect(contourPlacesFor(france)).toEqual(contourPlacesFor(france));
  });

  it('really has countries without a capital or without cities in the data (their plan is shorter)', () => {
    const all = CONTOURS.map((country) => contourPlacesFor(country, PLACES));
    expect(all.some((places) => places.capital === null)).toBe(true);
    expect(all.some((places) => places.cities.length === 0)).toBe(true);
  });
});
