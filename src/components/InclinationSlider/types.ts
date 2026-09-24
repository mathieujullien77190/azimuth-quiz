export type InclinationSliderProps = {
  /** Straight-line length: it's what determines the inclination (chord = 2R sin(inclination)). */
  distanceKm: number;
  maxKm: number;
  /** New straight-line length, derived from the chosen inclination. */
  onChange: (distanceKm: number) => void;
};
