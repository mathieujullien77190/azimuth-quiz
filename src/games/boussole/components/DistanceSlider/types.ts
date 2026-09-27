export type DistanceSliderProps = {
  valueKm: number;
  /** Upper bound of the track (depends on the mode: surface or straight line). */
  maxKm: number;
  onChange: (km: number) => void;
};
