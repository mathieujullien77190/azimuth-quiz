import { formatDistance, formatInclination, inclinationFromChordKm, kmToRatio, ratioToKm } from '@/helpers';

import SliderTrack from '../SliderTrack';
import { DEDUCED_DISTANCE_SUFFIX, INCLINATION_LABEL } from './constants';
import { distanceMarks } from './helpers';
import type { InclinationSliderProps } from './types';

/**
 * On choisit l'inclinaison ; seule la ligne droite (corde) qui en decoule est affichee, en
 * indication. La distance de surface au sol n'est jamais montree : c'est l'info du mode distance,
 * et la reveler ici viderait l'interet du mode inclinaison (le plus difficile des deux).
 */
export const InclinationSlider = ({ distanceKm, maxKm, onChange }: InclinationSliderProps) => {
  const inclination = inclinationFromChordKm(distanceKm);

  return (
    <SliderTrack
      caption={`≈ ${formatDistance(distanceKm)} ${DEDUCED_DISTANCE_SUFFIX}`}
      label={INCLINATION_LABEL}
      marks={distanceMarks(maxKm)}
      onRatioChange={(ratio) => onChange(ratioToKm(ratio, maxKm))}
      ratio={kmToRatio(distanceKm, maxKm)}
      valueText={formatInclination(inclination)}
    />
  );
};
