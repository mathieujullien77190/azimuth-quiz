export type OptionItem = {
  id: string;
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /** Keeps the option out of the list without removing it from the array — lets a game decide
   * from its own state (e.g. "hide other answers" only makes sense with 2+ players). */
  hidden?: boolean;
};

export type GpsOption = {
  title: string;
  description?: string;
  useGps: boolean;
  onToggleUseGps: (value: boolean) => void;
  /** Custom starting point, shown under the toggle only while `useGps` is off. */
  latitude: number;
  longitude: number;
  onChangeCustomOrigin: (patch: { customLatitude?: number; customLongitude?: number }) => void;
  /** The coordinate fields keep their own text state (see `CustomOriginInputs`), seeded once —
   * flip this when the persisted settings finish loading so they re-seed from the real values. */
  ready?: boolean;
};

export type OptionsSectionProps = {
  title: string;
  options: OptionItem[];
  /** "Use my GPS position" option (+ custom origin fields) — displayed only when provided, so a
   * game with no starting point (Clues) just omits it. Rendered after `options`. */
  gps?: GpsOption;
  disabled?: boolean;
};

export type CustomOriginInputsProps = {
  latitude: number;
  longitude: number;
  onChange: (patch: { customLatitude?: number; customLongitude?: number }) => void;
  disabled: boolean;
};
