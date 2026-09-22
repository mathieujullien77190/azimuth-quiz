import { DISTANCE_MARKS_KM } from '@/constants';
import { formatDistance, kmToRatio, ratioToKm } from '@/helpers';

import SliderTrack from '../SliderTrack';
import type { DistanceSliderProps } from './types';

export const DistanceSlider = ({ valueKm, maxKm, onChange }: DistanceSliderProps) => (
  <SliderTrack
    label="Distance estimée"
    marks={DISTANCE_MARKS_KM.filter((km) => km < maxKm).map((km) => ({
      ratio: kmToRatio(km, maxKm),
      label: formatDistance(km),
    }))}
    onRatioChange={(ratio) => onChange(ratioToKm(ratio, maxKm))}
    ratio={kmToRatio(valueKm, maxKm)}
    valueText={formatDistance(valueKm)}
  />
);
