import { MAX_DIRECTION_POINTS, MAX_DISTANCE_POINTS } from '@/constants';

export const ROW_LABELS = {
  direction: 'Direction',
  inclination: 'Inclinaison',
  distance: 'Distance',
} as const;

export const ROW_MAX_POINTS = {
  direction: MAX_DIRECTION_POINTS,
  distance: MAX_DISTANCE_POINTS,
} as const;

export const TRUTH_LABEL = 'Réponse';
