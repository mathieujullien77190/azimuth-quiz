import type { SilhouetteCountryDoc } from '@/data/firestore/read';
import type { ContourCountry, ContourNeighbor } from '@/types';

import { contours, data, putCountry } from '../data';

/** Every country with a silhouette, from the in-memory copy of Firestore (`data.ts`). */
export const allContours = (): ContourCountry[] => contours();

/** Rewrites `countries/{code}` with `change` applied — only ever called for a country that has a silhouette
 * (the editor is only mounted for those). */
const updateContour = async (
  code: string,
  change: (country: SilhouetteCountryDoc) => Partial<SilhouetteCountryDoc>,
) => {
  const country = data().countries[code] as SilhouetteCountryDoc;
  await putCountry(code, { ...country, ...change(country) });
};

/** A neighbor's on-board spot (see `ContourNeighbor`'s own doc comment — a fraction of the board
 * canvas, not a geographic coordinate) was dragged to a new spot: writes it and returns the updated
 * neighbor for the caller's own optimistic local state. */
export const saveNeighborPosition = async (
  country: ContourCountry,
  neighbor: ContourNeighbor,
  next: { x: number; y: number },
): Promise<ContourNeighbor> => {
  await updateContour(country.code, (doc) => ({
    neighbors: doc.neighbors.map((entry) => (entry.code === neighbor.code ? { ...entry, ...next } : entry)),
  }));
  return { ...neighbor, ...next };
};

/** Removes `neighbor` from the country's hints: the entry loses its position (`x`/`y`) but keeps its outline,
 * so the country is still drawn as a backdrop and in the coast/border split. */
export const deleteNeighbor = async (country: ContourCountry, neighbor: ContourNeighbor): Promise<void> => {
  await updateContour(country.code, (doc) => ({
    neighbors: doc.neighbors.map((entry) => {
      if (entry.code !== neighbor.code) return entry;
      const { x, y, ...rest } = entry;
      void x;
      void y;
      return rest;
    }),
  }));
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
