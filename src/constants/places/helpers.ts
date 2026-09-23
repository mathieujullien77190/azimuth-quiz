import type { Category, Difficulty, Place } from '@/types';

/** Un lieu sans sa difficulte : `tier()` l'assigne juste apres, par groupe. */
type UnratedPlace = Omit<Place, 'difficulty'>;

/**
 * Fabrique un constructeur de lieux pour une categorie : place('Lyon', 'FR', lat, lon), avec une
 * anecdote optionnelle : place(..., lat, lon, 'Capitale des Gaules...'), puis les fins d'URL
 * Wikipedia fr/en (pas l'URL complete) : place(..., description, 'Lyon', 'Lyon'). Le nom du pays
 * n'est pas stocke : `code` suffit, `countryName()` le traduit a l'affichage.
 */
export const placeFactory =
  (category: Category) =>
  (
    name: string,
    code: string,
    latitude: number,
    longitude: number,
    description?: string,
    wikiFr?: string,
    wikiEn?: string,
  ): UnratedPlace => ({
    name,
    code,
    category,
    coordinates: { latitude, longitude },
    ...(description !== undefined && { description }),
    ...(wikiFr !== undefined && { wikiFr }),
    ...(wikiEn !== undefined && { wikiEn }),
  });

/** Assigne une difficulte a tout un groupe de lieux d'un coup (plutot qu'un argument par ligne). */
export const tier =
  (difficulty: Difficulty) =>
  (places: UnratedPlace[]): Place[] =>
    places.map((place) => ({ ...place, difficulty }));
