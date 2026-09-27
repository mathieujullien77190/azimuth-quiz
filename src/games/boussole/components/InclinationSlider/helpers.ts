import { DISTANCE_MARKS_KM } from '@/constants';
import { formatInclination, inclinationFromChordKm, kmToRatio } from '@/helpers';

import type { SliderMark } from '../SliderTrack';

/**
 * Reperes du curseur : la piste reste positionnee sur une echelle de distance (logarithmique,
 * lisible pour les lieux proches comme lointains), mais la valeur choisie est une inclinaison —
 * les reperes affichent donc leur equivalent en degres, pas en km.
 */
export const distanceMarks = (maxKm: number): SliderMark[] =>
  DISTANCE_MARKS_KM.filter((km) => km < maxKm).map((km) => ({
    ratio: kmToRatio(km, maxKm),
    label: formatInclination(inclinationFromChordKm(km)),
  }));
