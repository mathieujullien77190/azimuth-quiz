import { sameJson } from './same';
import { decodeRing, encodeRing } from './polyline';
import { unflattenPoints } from './read';
import type { ContourCountryDoc } from './types';

/** A silhouette's ring, from whichever form the document has (the flat `points` while they are still there). */
const ringOf = (doc: ContourCountryDoc): [number, number][] =>
  doc.points.length > 0 ? unflattenPoints(doc.points) : decodeRing(doc.ring ?? '');

/**
 * The two fields the polyline migration adds to `contours/{code}`: its own outline encoded (`ring`) and the
 * outline of every country it borders that has a document (`neighborRings`, copied ring for ring so a shared
 * edge keeps the very same vertices on both sides).
 */
export const contourRingFields = (
  doc: ContourCountryDoc,
  docs: Record<string, ContourCountryDoc>,
): Pick<Required<ContourCountryDoc>, 'ring' | 'neighborRings'> => ({
  ring: encodeRing(ringOf(doc)),
  neighborRings: Object.fromEntries(
    doc.borderCodes.filter((code) => docs[code]).map((code) => [code, encodeRing(ringOf(docs[code]))]),
  ),
});

/** The countries whose document does not carry (up to date) `ring` and `neighborRings` yet. */
export const contoursNeedingRings = (docs: Record<string, ContourCountryDoc>): string[] =>
  Object.entries(docs)
    .filter(([, doc]) => !sameJson({ ring: doc.ring, neighborRings: doc.neighborRings }, contourRingFields(doc, docs)))
    .map(([code]) => code);
