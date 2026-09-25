/**
 * Places excluded from Contour's own city-phase pool ONLY (see `ContourGameScreen/helpers.ts`'s
 * `randomPlacesFor`) — the shared `places.json` (Boussole/Indices) is never touched, these stay
 * fully available there. Curated here rather than as a field on the shared `Place` type, same
 * reasoning as `neighbors.ts`/`centerLabels.ts`: a judgment call specific to this game (e.g. an
 * island city that reads badly pinned onto the mainland-only outline), not a property of the
 * place itself. Keyed by `${code}:${name}` (see `excludeKey`) since `Place` has no stable id.
 */
export const CONTOUR_EXCLUDED_PLACES: ReadonlySet<string> = new Set(['FR:Ajaccio', 'FR:Bastia']);

export const excludeKey = (code: string, name: string): string => `${code}:${name}`;
