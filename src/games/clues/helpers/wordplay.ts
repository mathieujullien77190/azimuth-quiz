import wordplayData from '@/data/wordplay.json';
import type { CluePlace } from '@/types';

/**
 * A play on words on the place's name, in 2 stages — `sentence` alone first, then `explained`
 * (typically the very same sentence, or close to it) with the word(s) that make the pun marked
 * with `+plus+` signs, see `highlightSegments`. Both start empty for every place: unlike
 * `charade`, there is no heuristic to fall back on here (finding a genuine pun is not something a
 * script can do) — curated entirely by hand in `scripts/wordplayCuration.json` and shipped by
 * `scripts/generateWordplay.mjs`, same no-invention rule as `personality`. A place with nothing
 * curated (or an empty `sentence`) never offers the clue at all, see `cluesFor`.
 */
export type WordplayEntry = { sentence: string; explained: string };

const WORDPLAY = wordplayData as unknown as Record<string, WordplayEntry>;

/** Same `${code}|${name}` key shape as `charadeKey`. */
export const wordplayKey = (place: Pick<CluePlace, 'name' | 'code'>): string => `${place.code}|${place.name}`;

/** `place`'s curated wordplay, or `null` when there is none (not curated yet, or curated with an
 * empty `sentence`) — never an empty, unclickable card. */
export const wordplayFor = (place: Pick<CluePlace, 'name' | 'code'>): WordplayEntry | null => {
  const entry = WORDPLAY[wordplayKey(place)];
  return entry !== undefined && entry.sentence.trim() !== '' ? entry : null;
};

/** One run of `text` between (or outside) `+plus+` markers: `highlighted` runs are the curated
 * pun itself, made to stand out; everything else is just connecting words. `+` is dropped from
 * the output either way — it is markup, not something to ever display. Each `+` just flips
 * highlighting on/off in order, so an odd (unclosed) one highlights everything after it — visible
 * feedback of the typo rather than a silent parse failure. */
export type HighlightSegment = { text: string; highlighted: boolean };

export const highlightSegments = (text: string): HighlightSegment[] => {
  const segments: HighlightSegment[] = [];
  let rest = text;
  let highlighted = false;
  while (rest.length > 0) {
    const nextMark = rest.indexOf('+');
    if (nextMark === -1) {
      segments.push({ text: rest, highlighted });
      break;
    }
    if (nextMark > 0) segments.push({ text: rest.slice(0, nextMark), highlighted });
    rest = rest.slice(nextMark + 1);
    highlighted = !highlighted;
  }
  return segments.filter((segment) => segment.text !== '');
};
