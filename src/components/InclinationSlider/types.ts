export type InclinationSliderProps = {
  /** Longueur de la ligne droite : c'est elle qui fixe l'inclinaison (corde = 2R sin(inclinaison)). */
  distanceKm: number;
  maxKm: number;
  /** Nouvelle longueur de ligne droite, deduite de l'inclinaison choisie. */
  onChange: (distanceKm: number) => void;
};
