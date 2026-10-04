import { REACTION_DISPLAY_MS } from '@/data';

/** How long a bubble takes to rise from the bottom of the screen to the top, fading in and out on the way. */
export const RISE_MS = REACTION_DISPLAY_MS;
/** Where on the 0-1 timeline of a bubble the fade-in ends and the fade-out starts. */
export const FADE_IN_END = 0.1;
export const FADE_OUT_START = 0.75;
/** A bubble starts this far above the bottom of the overlay (px): clear of the footer's own height. */
export const BOTTOM_OFFSET = 130;
/** The sideways wobble: how far (px) it drifts either way, and how many to-and-fro it makes on the way up. */
export const WOBBLE_PX = 10;
export const WOBBLE_CYCLES = 3;
/** The steps of the wobble's curve across the timeline (a sine, sampled: Animated interpolates between samples). */
export const WOBBLE_STEPS = 24;
/** Bubbles that come one after the other do not all rise up the same line: each starts this many px apart, cycling
 * over this many lanes (from `seq`, so every device draws the same). */
export const LANE_PX = 34;
export const LANES = 5;
