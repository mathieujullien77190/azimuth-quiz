import { arcKmFromInclination, formatDistance, formatInclination, inclinationFromChordKm, kmToRatio, ratioToKm } from '@/helpers';

import SliderTrack from '../SliderTrack';
import { DEDUCED_DISTANCE_SUFFIX, GROUND_DISTANCE_SUFFIX, INCLINATION_LABEL } from './constants';
import { distanceMarks } from './helpers';
import type { InclinationSliderProps } from './types';

/**
 * On choisit l'inclinaison ; la ligne droite (corde) et la distance de surface en decoulent
 * toutes les deux et sont seulement affichees, en indication.
 */
export const InclinationSlider = ({ distanceKm, maxKm, onChange }: InclinationSliderProps) => {
  const inclination = inclinationFromChordKm(distanceKm);

  return (
    <SliderTrack
      caption={`≈ ${formatDistance(distanceKm)} ${DEDUCED_DISTANCE_SUFFIX} · ${formatDistance(arcKmFromInclination(inclination))} ${GROUND_DISTANCE_SUFFIX}`}
      label={INCLINATION_LABEL}
      marks={distanceMarks(maxKm)}
      onRatioChange={(ratio) => onChange(ratioToKm(ratio, maxKm))}
      ratio={kmToRatio(distanceKm, maxKm)}
      valueText={formatInclination(inclination)}
    />
  );
};
