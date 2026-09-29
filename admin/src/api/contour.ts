import type { ContourCountry, ContourNeighbor } from '@/types';

import { contours, data, putCountry } from '../data';

/** Every country with a silhouette, from the in-memory copy of Firestore (`data.ts`). */
export const allContours = (): ContourCountry[] => contours();

/** Rewrites `code`'s stored contour with `change` applied — only ever called for a country that
 * has one (the editor is only mounted for those). */
const updateContour = async (code: string, change: (contour: NonNullable<ReturnType<typeof data>['countries'][string]['contour']>) => object) => {
  const doc = data().countries[code];
  await putCountry(code, { ...doc, contour: { ...doc.contour!, ...change(doc.contour!) } });
};

/** A neighbor's on-board spot (see `ContourNeighbor`'s own doc comment — a fraction of the board
 * canvas, not a geographic coordinate) was dragged to a new spot: writes it and returns the updated
 * neighbor for the caller's own optimistic local state. */
export const saveNeighborPosition = async (
  country: ContourCountry,
  neighbor: ContourNeighbor,
  next: { x: number; y: number },
): Promise<ContourNeighbor> => {
  await updateContour(country.code, (contour) => ({
    neighbors: (contour.neighbors ?? []).map((n) => (n.code === neighbor.code ? { ...n, ...next } : n)),
  }));
  return { ...neighbor, ...next };
};

/** Removes `neighbor` from the country's hinted neighbors. */
export const deleteNeighbor = async (country: ContourCountry, neighbor: ContourNeighbor): Promise<void> => {
  await updateContour(country.code, (contour) => ({ neighbors: (contour.neighbors ?? []).filter((n) => n.code !== neighbor.code) }));
};

/** The target country's own flag/name anchor (see `ContourCountry.centerLabel`) was dragged to a
 * new spot. */
export const saveCenterLabelPosition = async (
  country: ContourCountry,
  _previous: { x: number; y: number },
  next: { x: number; y: number },
): Promise<{ x: number; y: number }> => {
  await updateContour(country.code, () => ({ centerLabel: next }));
  return next;
};
