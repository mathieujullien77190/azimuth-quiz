import type { RoundScore } from '@/types';

/** Fallback for a player who has no score for a round — a player who left the room between
 * submitting and the host finishing the round, in practice. Everything at 0 rather than throwing:
 * a vanished player's row is more useful than a crash. */
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

/** Needle at north, distance slider at its default step: every device's starting draft, reset at
 * the top of every round. */
export const DEFAULT_BEARING = 0;

export const MAX_COMPASS_SIZE = 300;
export const MAX_EARTH_SIZE = 240;

/** On reveal, players' answers are slightly faded to make the true answer stand out. */
export const REVEAL_OPACITY = 0.8;

/** How long the travel-mode "you are in ..." splash stays up on its own at the start of a round (ms). */
export const TRAVEL_NOTICE_MS = 3000;
