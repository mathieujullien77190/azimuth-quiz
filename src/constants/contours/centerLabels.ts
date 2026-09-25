import type { ContourCenterLabel } from '@/types';

/**
 * Hand-curated per-country anchor for tier 3/4's own on-board label (the target country's own
 * flag, then its name stacked just below it) — merged into each `ContourCountry` at decode time
 * (see `codec.ts`), same pattern and same `x`/`y`-fraction-of-the-board-canvas model as
 * `neighbors.ts`. Seeded from each country's own outline bounding-box center (`x`/`y` of 0.5),
 * editable afterwards from the admin's Contour view the same way neighbor positions are (drag to
 * move, logged to the journal — nothing written to disk).
 */
export const CONTOUR_CENTER_LABELS: Record<string, ContourCenterLabel> = {
  DE: { x: 0.5, y: 0.5 },
  ES: { x: 0.4747, y: 0.4162 },
  FR: { x: 0.607, y: 0.519 },
  GR: { x: 0.5, y: 0.5 },
  IE: { x: 0.5, y: 0.5 },
  IT: { x: 0.5, y: 0.5 },
  NO: { x: 0.5, y: 0.5 },
  PT: { x: 0.5, y: 0.5 },
};
