export const APP_TITLE = 'AZIMUTH QUIZ';

// Approximate footprint of the roaming mascot (UFO by night, helicopter by day — see
// `MascotButton`), to keep it fully visible as it randomly moves within the title zone.
export const MASCOT_FOOTPRINT = { width: 56, height: 64 };
// Duration of the "flight" (transition) from one position to another.
export const MASCOT_MOVE_DURATION_MS = 350;
// Pause duration at rest between two moves, drawn at random each cycle.
export const MASCOT_PAUSE_OPTIONS_S = [3, 4, 5, 6] as const;
// When the drawn pause equals this duration, the mascot spins in place during the pause (fast
// rotation, doesn't last the whole pause).
export const MASCOT_SPIN_PAUSE_S = 6;
export const MASCOT_SPIN_DURATION_MS = 1000;
