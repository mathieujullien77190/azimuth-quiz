export const APP_TITLE = 'FULL AZIMUT';

// Approximate footprint of the UFO button (dome + ring), to keep it fully visible
// as it randomly moves within the title zone.
export const UFO_FOOTPRINT = { width: 56, height: 64 };
// Duration of the "flight" (transition) from one position to another.
export const UFO_MOVE_DURATION_MS = 350;
// Pause duration at rest between two moves, drawn at random each cycle.
export const UFO_PAUSE_OPTIONS_S = [3, 4, 5, 6] as const;
// When the drawn pause equals this duration, the UFO spins in place during the
// pause (fast rotation, doesn't last the whole pause).
export const UFO_SPIN_PAUSE_S = 6;
export const UFO_SPIN_DURATION_MS = 1000;
