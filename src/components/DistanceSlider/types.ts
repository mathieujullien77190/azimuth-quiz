export type DistanceSliderProps = {
  valueKm: number;
  /** Borne haute de la piste (depend du mode : surface ou ligne droite). */
  maxKm: number;
  onChange: (km: number) => void;
};
