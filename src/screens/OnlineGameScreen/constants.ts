import type { RoundScore } from '@/types';

/**
 * Repli pour un joueur sans score de la manche (parti entre l'envoi et la fin de manche) : tout a 0 plutot
 * qu'un crash.
 */
export const ZERO_SCORE: RoundScore = {
  trueBearing: 0,
  trueSurfaceDistanceKm: 0,
  directionError: 0,
  distanceError: 0,
  directionPoints: 0,
  distancePoints: 0,
  directionBonus: 0,
  distanceBonus: 0,
  directionExactBonus: 0,
  distanceExactBonus: 0,
  targetGapKm: 0,
  total: 0,
};

/** Aiguille au nord, curseur au pas par defaut : brouillon de depart, remis a zero a chaque manche. */
export const DEFAULT_BEARING = 0;

export const MAX_COMPASS_SIZE = 300;
export const MAX_EARTH_SIZE = 240;

/** Au reveal, les reponses des joueurs sont un peu estompees pour faire ressortir la vraie. */
export const REVEAL_OPACITY = 0.8;

/** Duree du splash "vous etes a ..." du mode voyage en debut de manche (ms). */
export const TRAVEL_NOTICE_MS = 3000;
