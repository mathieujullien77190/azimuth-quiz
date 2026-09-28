export type DistanceSliderProps = {
  valueKm: number;
  /** Upper bound of the track (surface distance). */
  maxKm: number;
  onChange: (km: number) => void;
};
