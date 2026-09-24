export const APP_TITLE = 'AZIMUTH QUIZ';

// Approximate footprint of the helicopter button (fuselage + rotor span), to keep it fully
// visible as it randomly moves within the title zone.
export const HELICOPTER_FOOTPRINT = { width: 56, height: 64 };
// Duration of the "flight" (transition) from one position to another.
export const HELICOPTER_MOVE_DURATION_MS = 350;
// Pause duration at rest between two moves, drawn at random each cycle.
export const HELICOPTER_PAUSE_OPTIONS_S = [3, 4, 5, 6] as const;
// When the drawn pause equals this duration, the helicopter does a pirouette in place during
// the pause (fast yaw spin, doesn't last the whole pause).
export const HELICOPTER_SPIN_PAUSE_S = 6;
export const HELICOPTER_SPIN_DURATION_MS = 1000;
