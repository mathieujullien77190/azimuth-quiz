export type OptionItem = {
  id: string;
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export type GpsOption = {
  title: string;
  description?: string;
  useGps: boolean;
  onToggleUseGps: (value: boolean) => void;
  /** Point de depart perso, affiche sous le toggle seulement quand `useGps` est faux. */
  latitude: number;
  longitude: number;
  onChangeCustomOrigin: (patch: { customLatitude?: number; customLongitude?: number }) => void;
  /**
   * Les champs de coordonnees gardent leur propre state texte (voir `CustomOriginInputs`), initialise une fois :
   * changer cette valeur quand les reglages persistes finissent de charger pour les reinitialiser.
   */
  ready?: boolean;
};

export type OptionsSectionProps = {
  title: string;
  options: OptionItem[];
  /**
   * Option « Utiliser ma position GPS » (+ champs d'origine perso), affichee seulement si fournie : un jeu sans
   * point de depart (Indices) l'omet. Rendue apres `options`.
   */
  gps?: GpsOption;
  disabled?: boolean;
};

export type CustomOriginInputsProps = {
  latitude: number;
  longitude: number;
  onChange: (patch: { customLatitude?: number; customLongitude?: number }) => void;
  disabled: boolean;
};
