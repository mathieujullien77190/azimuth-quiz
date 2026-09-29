import { countryName } from '@/data/places/countries';
import type { ContourCountry, ContourNeighbor } from '@/types';

import { logChange } from '../changelog';
import { contours, data, putCountry } from '../data';

/** Every country with a silhouette, from the in-memory copy of Firestore (`data.ts`). */
export const allContours = (): ContourCountry[] => contours();

const neighborIdentity = (neighbor: ContourNeighbor): string => countryName(neighbor.code, 'fr');

const fmtXY = (x: number, y: number): string => `x ${(x * 100).toFixed(1)}%, y ${(y * 100).toFixed(1)}%`;

/** Rewrites `code`'s stored contour with `change` applied — only ever called for a country that
 * has one (the editor is only mounted for those). */
const updateContour = async (code: string, change: (contour: NonNullable<ReturnType<typeof data>['countries'][string]['contour']>) => object) => {
  const doc = data().countries[code];
  await putCountry(code, { ...doc, contour: { ...doc.contour!, ...change(doc.contour!) } });
};

/** A neighbor's on-board spot (see `ContourNeighbor`'s own doc comment — a fraction of the board
 * canvas, not a geographic coordinate) was dragged to a new spot: writes it, logs the before/after
 * position and returns the updated neighbor for the caller's own optimistic local state. */
export const saveNeighborPosition = async (
  country: ContourCountry,
  neighbor: ContourNeighbor,
  next: { x: number; y: number },
): Promise<ContourNeighbor> => {
  await updateContour(country.code, (contour) => ({
    neighbors: (contour.neighbors ?? []).map((n) => (n.code === neighbor.code ? { ...n, ...next } : n)),
  }));
  logChange(
    `[Contour] ${countryName(country.code, 'fr')} — voisin ${neighborIdentity(neighbor)} : ${fmtXY(neighbor.x, neighbor.y)} -> ${fmtXY(next.x, next.y)}`,
  );
  return { ...neighbor, ...next };
};

/** Same `[Suppression] ...` wording as `deletePlace`, under our own `[Contour]` tag. */
export const deleteNeighbor = async (country: ContourCountry, neighbor: ContourNeighbor): Promise<void> => {
  await updateContour(country.code, (contour) => ({ neighbors: (contour.neighbors ?? []).filter((n) => n.code !== neighbor.code) }));
  logChange(`[Contour] ${countryName(country.code, 'fr')} — suppression du voisin ${neighborIdentity(neighbor)}`);
};

/** The target country's own flag/name anchor (see `ContourCountry.centerLabel`) was dragged to a
 * new spot. */
export const saveCenterLabelPosition = async (
  country: ContourCountry,
  previous: { x: number; y: number },
  next: { x: number; y: number },
): Promise<{ x: number; y: number }> => {
  await updateContour(country.code, () => ({ centerLabel: next }));
  logChange(`[Contour] ${countryName(country.code, 'fr')} — drapeau/nom du pays : ${fmtXY(previous.x, previous.y)} -> ${fmtXY(next.x, next.y)}`);
  return next;
};
