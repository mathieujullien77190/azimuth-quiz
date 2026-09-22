import type { Category, Place } from '@/types';

/** Fabrique un constructeur de lieux pour une categorie : place('Lyon', 'France', 'FR', lat, lon). */
export const placeFactory =
  (category: Category) =>
  (name: string, country: string, code: string, latitude: number, longitude: number): Place => ({
    name,
    country,
    code,
    category,
    coordinates: { latitude, longitude },
  });
