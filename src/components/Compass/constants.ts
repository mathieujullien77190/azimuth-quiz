export const TICK_STEP_DEG = 5;

// Proportions relatives au rayon de la boussole.
export const FACE_RADIUS_RATIO = 0.96;
export const TICK_OUTER_RATIO = 0.93;
export const TICK_LENGTH_RATIO = { cardinal: 0.13, intercardinal: 0.09, minor: 0.05 } as const;
export const LABEL_RADIUS_RATIO = 0.68;
export const NEEDLE_LENGTH_RATIO = 0.66;
export const NEEDLE_TAIL_RATIO = 0.18;
export const NEEDLE_HALF_WIDTH_RATIO = 0.075;
export const KNOB_RADIUS_RATIO = 0.74;

export const CARDINAL_POINTS = [
  { label: 'N', bearing: 0 },
  { label: 'E', bearing: 90 },
  { label: 'S', bearing: 180 },
  { label: 'O', bearing: 270 },
] as const;
