import type { Category, Difficulty, Place } from '@/types';

/** Un lieu sans sa difficulte : `tier()` l'assigne juste apres, par groupe. */
type UnratedPlace = Omit<Place, 'difficulty'>;

/**
 * Fabrique un constructeur de lieux pour une categorie : place('Lyon', 'France', 'FR', lat, lon),
 * avec une anecdote optionnelle en dernier argument : place(..., lat, lon, 'Capitale des Gaules...').
 */
export const placeFactory =
  (category: Category) =>
  (name: string, country: string, code: string, latitude: number, longitude: number, description?: string): UnratedPlace => ({
    name,
    country,
    code,
    category,
    coordinates: { latitude, longitude },
    ...(description !== undefined && { description }),
  });

/** Assigne une difficulte a tout un groupe de lieux d'un coup (plutot qu'un argument par ligne). */
export const tier =
  (difficulty: Difficulty) =>
  (places: UnratedPlace[]): Place[] =>
    places.map((place) => ({ ...place, difficulty }));
