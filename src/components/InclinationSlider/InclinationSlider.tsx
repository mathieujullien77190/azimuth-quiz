import { formatInclination, inclinationFromChordKm, kmToRatio, ratioToKm } from '@/helpers';

import SliderTrack from '../SliderTrack';
import { INCLINATION_LABEL } from './constants';
import { distanceMarks } from './helpers';
import type { InclinationSliderProps } from './types';

/**
 * On choisit l'inclinaison ; aucune distance n'est affichee (ni ligne droite, ni au sol) pour ne
 * pas donner l'info que le mode distance donne directement, ce qui viderait l'interet du mode
 * inclinaison (le plus difficile des deux).
 */
export const InclinationSlider = ({ distanceKm, maxKm, onChange }: InclinationSliderProps) => {
  const inclination = inclinationFromChordKm(distanceKm);

  return (
    <SliderTrack
      label={INCLINATION_LABEL}
      marks={distanceMarks(maxKm)}
      onRatioChange={(ratio) => onChange(ratioToKm(ratio, maxKm))}
      ratio={kmToRatio(distanceKm, maxKm)}
      valueText={formatInclination(inclination)}
    />
  );
};
