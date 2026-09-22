import { formatDistance, formatInclination, inclinationFromChordKm, kmToRatio, ratioToKm } from '@/helpers';

import SliderTrack from '../SliderTrack';
import { DEDUCED_DISTANCE_SUFFIX, INCLINATION_LABEL } from './constants';
import { distanceMarks } from './helpers';
import type { InclinationSliderProps } from './types';

/** On choisit l'inclinaison ; la distance en ligne droite en est deduite et seulement affichee. */
export const InclinationSlider = ({ distanceKm, maxKm, onChange }: InclinationSliderProps) => (
  <SliderTrack
    caption={`≈ ${formatDistance(distanceKm)} ${DEDUCED_DISTANCE_SUFFIX}`}
    label={INCLINATION_LABEL}
    marks={distanceMarks(maxKm)}
    onRatioChange={(ratio) => onChange(ratioToKm(ratio, maxKm))}
    ratio={kmToRatio(distanceKm, maxKm)}
    valueText={formatInclination(inclinationFromChordKm(distanceKm))}
  />
);
