import type { Category, Difficulty, Place } from '@/types';

/** Un lieu sans sa difficulte : `tier()` l'assigne juste apres, par groupe. */
type UnratedPlace = Omit<Place, 'difficulty'>;

/** Fabrique un constructeur de lieux pour une categorie : place('Lyon', 'France', 'FR', lat, lon). */
export const placeFactory =
  (category: Category) =>
  (name: string, country: string, code: string, latitude: number, longitude: number): UnratedPlace => ({
    name,
    country,
    code,
    category,
    coordinates: { latitude, longitude },
  });

/** Assigne une difficulte a tout un groupe de lieux d'un coup (plutot qu'un argument par ligne). */
export const tier =
  (difficulty: Difficulty) =>
  (places: UnratedPlace[]): Place[] =>
    places.map((place) => ({ ...place, difficulty }));
