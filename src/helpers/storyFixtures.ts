import { DEFAULT_ORIGIN, PLAYER_COLORS } from '@/data';
import { DEFAULT_DISTANCE_KM, MAX_SURFACE_DISTANCE_KM } from '@/data/game';
import type { Guess, Place, Player, PlayerResult, RoundRecord } from '@/types';

import { bearingDeg, distanceKm, normalizeBearing } from './geo';
import { applyBestBonus, scoreRound } from '@/helpers/scoring';

// Donnees d'exemple pour les `.stories.tsx` et les tests : petites, ecrites a la main (les vraies donnees sont dans
// Firestore). Ici et pas dans `admin/`, qui depend de `src/` et non l'inverse.

/** Quelques lieux Compass, au format d'un document Firestore. */
const FIXTURE_PLACES: Place[] = [
  {
    name: 'Tokyo',
    code: 'JP',
    country: { fr: 'Japon', en: 'Japan' },
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    category: 'capital',
    difficulty: 'easy',
    description: 'Plus grande agglomération du monde, elle s’appelait Edo avant de devenir la capitale en 1868.',
    wikiFr: 'Tokyo',
    wikiEn: 'Tokyo',
  },
  {
    name: 'Paris',
    code: 'FR',
    country: { fr: 'France', en: 'France' },
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    category: 'capital',
    difficulty: 'easy',
  },
  {
    name: 'Berlin',
    code: 'DE',
    country: { fr: 'Allemagne', en: 'Germany' },
    coordinates: { latitude: 52.52, longitude: 13.405 },
    category: 'capital',
    difficulty: 'easy',
  },
  {
    name: 'Rome',
    code: 'IT',
    country: { fr: 'Italie', en: 'Italy' },
    coordinates: { latitude: 41.9028, longitude: 12.4964 },
    category: 'capital',
    difficulty: 'easy',
  },
];

const findPlace = (name: string, code: string): Place =>
  FIXTURE_PLACES.find((place) => place.name === name && place.code === code)!;

/** Lieu Compass d'exemple avec description (etat revele de PlaceCard). */
export const SAMPLE_PLACE_REVEALED: Place = findPlace('Tokyo', 'JP');

export const SAMPLE_PLAYERS: Player[] = [
  { name: 'Zoé', color: PLAYER_COLORS[0] },
  { name: 'Max', color: PLAYER_COLORS[1] },
  { name: 'Léo', color: PLAYER_COLORS[2] },
];

const ORIGIN = DEFAULT_ORIGIN.coordinates;
const TRUE_BEARING = bearingDeg(ORIGIN, SAMPLE_PLACE_REVEALED.coordinates);
const TRUE_DISTANCE_KM = distanceKm(ORIGIN, SAMPLE_PLACE_REVEALED.coordinates);

/** Trois reponses (exacte, trop loin, tres loin) passees par les vrais helpers de score : valeurs reelles. */
const SAMPLE_GUESSES: Guess[] = [
  { bearing: normalizeBearing(TRUE_BEARING + 2), distanceKm: Math.round(TRUE_DISTANCE_KM * 0.97) },
  { bearing: normalizeBearing(TRUE_BEARING - 18), distanceKm: Math.round(TRUE_DISTANCE_KM * 1.35) },
  { bearing: normalizeBearing(TRUE_BEARING + 55), distanceKm: Math.round(TRUE_DISTANCE_KM * 0.4) },
];

const SAMPLE_RESULTS: PlayerResult[] = applyBestBonus(
  SAMPLE_GUESSES.map((guess) => ({
    guess,
    score: scoreRound(ORIGIN, SAMPLE_PLACE_REVEALED, guess),
  })),
);

export const SAMPLE_ROUND_RECORD: RoundRecord = { place: SAMPLE_PLACE_REVEALED, results: SAMPLE_RESULTS };

/** Manche 1 : totaux cumules = totaux de la manche. */
export const SAMPLE_TOTALS: number[] = SAMPLE_RESULTS.map((result) => result.score.total);

export const SAMPLE_MAX_SURFACE_KM = MAX_SURFACE_DISTANCE_KM;

export const SAMPLE_DISTANCE_KM = DEFAULT_DISTANCE_KM;
