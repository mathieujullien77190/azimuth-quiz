import type { RoundScore } from '@/types';

/** Fallback for a player who has no score for a round — a player who left the room between
 * submitting and the host finishing the round, in practice. Everything at 0 rather than throwing:
 * a vanished player's row is more useful than a crash. */
export const ZERO_SCORE: RoundScore = {
  trueBearing: 0,
  trueInclination: 0,
  trueSurfaceDistanceKm: 0,
  trueStraightDistanceKm: 0,
  directionError: 0,
  distanceError: 0,
  directionPoints: 0,
  distancePoints: 0,
  directionBonus: 0,
  distanceBonus: 0,
  directionExactBonus: 0,
  distanceExactBonus: 0,
  total: 0,
};

/** Needle at north, distance slider at its default step: same starting draft as the local
 * same-device game (`useGame`'s own `DEFAULT_DRAFT`), reset at the top of every round. */
export const DEFAULT_BEARING = 0;
