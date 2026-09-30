import { normalizeSyllable } from '@/data/firestore/riddles';
import type { CluePlace } from '@/types';

/** One place's syllables, always lowercase — see `charadeFor`'s own doc comment for where they
 * come from. Each syllable's riddle (the classic "mon premier est..." wording — see
 * `charadeLines`) belongs to its syllable, curated once for every place that has it: each place carries the
 * riddles of its own syllables (`CluePlace.riddles`, same order), copied in by the admin, so a round reads no
 * dictionary. */
export type CharadeEntry = { syllables: string[]; riddles: (string | null)[] };

export { normalizeSyllable };

/** `place`'s syllable split (always lowercase) and the riddle of each syllable, both stored on the place
 * itself (`places/{id}` in Firestore). Nothing is computed here at runtime, ever. */
export const charadeFor = (place: Pick<CluePlace, 'syllables' | 'riddles'>): CharadeEntry => ({
  syllables: place.syllables,
  riddles: place.riddles,
});

/** The charade clue is only ever offered when EVERY one of `place`'s syllables has a curated
 * riddle (`CluePlace.riddles`) — same never-invent rule as `personality`/`wordplay` (`cluesFor`): a
 * partially-curated charade (some syllables read as a real riddle, others fall back to "se dit «
 * xx »") reads as unfinished, not as a fun puzzle. A place with no syllables at all (a hand
 * override emptied it out, e.g. "Bălți") is never "ready" either — vacuously-true `every` on an
 * empty array would otherwise offer an empty card. */
export const charadeReady = (place: Pick<CluePlace, 'syllables' | 'riddles'>): boolean =>
  place.syllables.length > 0 && place.syllables.every((_, index) => (place.riddles[index] ?? null) !== null);

/** A very long name would otherwise cost far more picks than every other multi-stage clue (2-3):
 * past this many syllables, the remaining ones are all folded into one last, bundled stage (see
 * `charadeSyllableGroups`) instead of one stage each — capping the clue's worst-case cost. */
export const CHARADE_SYLLABLE_STAGE_CAP = 4;

/** The clue's absolute worst case: `CHARADE_SYLLABLE_STAGE_CAP` syllable-reveal stages (whatever
 * the real syllable count, past the cap they share the last one). A short name reaches its own,
 * lower `charadeMaxStage` well before this. */
export const CHARADE_MAX_STAGES = CHARADE_SYLLABLE_STAGE_CAP;

/**
 * `entry.syllables`' indices, grouped into the stages a player reveals one click at a time: one
 * syllable per group up to `CHARADE_SYLLABLE_STAGE_CAP`, then every remaining syllable bundled
 * into one last group — so "Paris" (2 syllables) is 2 one-syllable clicks, while a 6-syllable
 * capital like "Antananarivo" is 3 one-syllable clicks then a 4th click for the last 3 syllables
 * together (still just one card-worth of extra cost, not three).
 */
export const charadeSyllableGroups = (syllableCount: number): number[][] => {
  if (syllableCount <= CHARADE_SYLLABLE_STAGE_CAP) {
    return Array.from({ length: syllableCount }, (_, index) => [index]);
  }
  const groups = Array.from({ length: CHARADE_SYLLABLE_STAGE_CAP - 1 }, (_, index) => [index]);
  const bundleStart = CHARADE_SYLLABLE_STAGE_CAP - 1;
  groups.push(Array.from({ length: syllableCount - bundleStart }, (_, index) => bundleStart + index));
  return groups;
};

/** How many clicks `entry`'s card takes to reveal everything: one per `charadeSyllableGroups` group. */
export const charadeMaxStage = (entry: CharadeEntry): number => charadeSyllableGroups(entry.syllables.length).length;

const ORDINALS = ['mon premier', 'mon deuxième', 'mon troisième', 'mon quatrième'];

/** One riddle line, in the classic charade wording ("mon premier est..."): `label` is the ordinal
 * ("mon premier"), `text` the predicate that follows "est" — curated when there is one, otherwise
 * the syllable itself, read out loud, as a plain (less playful, but still usable) fallback. */
export type CharadeLine = { label: string; text: string };

/**
 * What a card shows after `stage` clicks: the riddle lines for every syllable-group revealed so
 * far (see `charadeSyllableGroups`). The last group is the clue's last stage: the name is never spelled
 * out in clear.
 */
export const charadeLines = (entry: CharadeEntry, stage: number): { lines: CharadeLine[] } => {
  const groups = charadeSyllableGroups(entry.syllables.length);
  const revealedGroups = groups.slice(0, Math.max(0, Math.min(stage, groups.length)));
  const lines = revealedGroups.map((group, index) => {
    const syllableText = (syllableIndex: number) => entry.syllables[syllableIndex];
    if (group.length === 1) {
      const [syllableIndex] = group;
      const riddle = entry.riddles[syllableIndex];
      // `groups` never has more entries than `ORDINALS` (both bounded by `CHARADE_SYLLABLE_STAGE_CAP`).
      return { label: ORDINALS[index], text: riddle ?? `se dit « ${syllableText(syllableIndex)} »` };
    }
    return { label: 'mes dernières syllabes', text: group.map(syllableText).join(', ') };
  });
  return { lines };
};
