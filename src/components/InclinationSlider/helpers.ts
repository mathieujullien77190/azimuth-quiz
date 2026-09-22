import { DISTANCE_MARKS_KM } from '@/constants';
import { formatDistance, kmToRatio } from '@/helpers';

import type { SliderMark } from '../SliderTrack';

/**
 * Reperes du curseur. La piste est logarithmique : elle se lit mieux en distances qu'en degres
 * (les angles utiles pour les lieux proches tiennent dans les premiers degres).
 */
export const distanceMarks = (maxKm: number): SliderMark[] =>
  DISTANCE_MARKS_KM.filter((km) => km < maxKm).map((km) => ({ ratio: kmToRatio(km, maxKm), label: formatDistance(km) }));
