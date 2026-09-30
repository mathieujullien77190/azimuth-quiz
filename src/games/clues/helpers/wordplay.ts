import type { CluePlace, Difficulty } from '@/types';

/**
 * A play on words on the place's name, one sentence, revealed in a single click (no second,
 * "explained" stage — dropped: the highlight was rarely worth a second click on top of the pun
 * itself). `difficulty` is curated alongside it — how tricky THIS pun is to get, independent from
 * `place`'s own difficulty — shown as a plain colored dot (see `ClueCard`'s own wordplay case),
 * never gating whether the clue is offered. Starts empty for every place: unlike `charade`, there
 * is no heuristic to fall back on here (finding a genuine pun is not something a script can do) —
 * curated entirely by hand in `scripts/wordplayCuration.json` and shipped by
 * `scripts/generateWordplay.mjs`, same no-invention rule as `personality`. A place with nothing
 * curated (or an empty `sentence`) never offers the clue at all, see `cluesFor`.
 *
 * Stored on the place itself (`places/{id}.wordplay` in Firestore, edited in the admin) and copied into the
 * `CluePlace` the host draws, so a round reads nothing else.
 */
export type WordplayEntry = { sentence: string; difficulty: Difficulty };

/** `place`'s curated wordplay, or `null` when there is none (not curated yet, or curated with an
 * empty `sentence`) — never an empty, unclickable card. */
export const wordplayFor = (place: Pick<CluePlace, 'wordplay'>): WordplayEntry | null =>
  place.wordplay !== undefined && place.wordplay.sentence.trim() !== '' ? place.wordplay : null;
