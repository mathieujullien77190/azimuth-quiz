import charadeData from '@/data/charade.json';
import type { CluePlace } from '@/types';

import { syllabify } from './syllabify';

/** One place's syllables, always lowercase — see `charadeFor`'s own doc comment for where they
 * come from. Each syllable's riddle (the classic "mon premier est..." wording — see
 * `charadeLines`) is looked up separately, by the syllable's own text (`riddleFor`): the same
 * riddle applies wherever that syllable shows up, across every place, rather than being curated
 * once per place that happens to have it. */
export type CharadeEntry = { syllables: string[] };

const CHARADE = charadeData as unknown as Record<string, string>;

/** Case-insensitive ("Pa" and "pa" share the same curated riddle), and folds "à"/"â" onto "a":
 * true homophones in French (unlike the "e" family — "e"/"é"/"è" are genuinely different sounds,
 * left alone on purpose) — so a syllable spelled either way still finds the same riddle. Exported
 * for the admin's own syllable list (`SyllablesView`), which needs the exact same key to group
 * "pa"/"pà"/"pâ" into one row rather than showing near-duplicates. */
export const normalizeSyllable = (syllable: string): string => syllable.toLowerCase().replace(/[àâ]/g, 'a');

/** The curated riddle for this exact syllable text, or `null` when none is curated yet — shipped
 * by `scripts/generateCharades.mjs`, curated by hand in `scripts/charadeCuration.json` (and, for
 * now, in the admin's own Charade panel — see `admin/src/api/charades.ts` — which only ever logs
 * a line to copy over by hand, same no-backend pattern as every other admin edit). Never
 * required: a syllable with nothing curated still reads fine in the card (see `charadeLines`'s
 * own doc comment), curation only ever makes an existing hint better. */
export const riddleFor = (syllable: string): string | null => CHARADE[normalizeSyllable(syllable)] ?? null;

/**
 * `place`'s syllable split, always lowercase (a curated override is stored that way; the
 * heuristic fallback is lowercased here too, so the two never disagree on casing): `place.syllables`
 * when a human has hand-corrected it — baked directly into `places.json` as `ClueRow`'s own
 * optional last element, see `data/places/codec.ts`'s own doc comment — otherwise the live
 * `syllabify` heuristic. Every Clue place always has *some* split; an override is never required,
 * only ever a hand correction (and can legitimately be an empty array, see `ClueRow`).
 */
export const charadeFor = (place: Pick<CluePlace, 'name' | 'syllables'>): CharadeEntry => {
  const syllables = place.syllables ?? syllabify(place.name);
  return { syllables: syllables.map((syllable) => syllable.toLowerCase()) };
};

/** A very long name would otherwise cost far more picks than every other multi-stage clue (2-3):
 * past this many syllables, the remaining ones are all folded into one last, bundled stage (see
 * `charadeSyllableGroups`) instead of one stage each — capping the clue's worst-case cost. */
export const CHARADE_SYLLABLE_STAGE_CAP = 4;

/** The clue's absolute worst case: `CHARADE_SYLLABLE_STAGE_CAP` syllable-reveal stages (whatever
 * the real syllable count, past the cap they share the last one), plus the final "spelled out
 * in clear" stage. A short name reaches its own, lower `charadeMaxStage` well before this. */
export const CHARADE_MAX_STAGES = CHARADE_SYLLABLE_STAGE_CAP + 1;

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

/** How many clicks `entry`'s card takes to reveal everything: one per `charadeSyllableGroups`
 * group, plus the final "in clear" stage. */
export const charadeMaxStage = (entry: CharadeEntry): number => charadeSyllableGroups(entry.syllables.length).length + 1;

const ORDINALS = ['mon premier', 'mon deuxième', 'mon troisième', 'mon quatrième'];

/** One riddle line, in the classic charade wording ("mon premier est..."): `label` is the ordinal
 * ("mon premier"), `text` the predicate that follows "est" — curated when there is one, otherwise
 * the syllable itself, read out loud, as a plain (less playful, but still usable) fallback. */
export type CharadeLine = { label: string; text: string };

/**
 * What a card shows after `stage` clicks: the riddle lines for every syllable-group revealed so
 * far (see `charadeSyllableGroups`), and, once `stage` goes past the last syllable-group (the
 * clue's final stage), the whole name spelled out as its syllables in clear (e.g. "Bor-deaux") —
 * the filet de sécurité, same spirit as the `letter` clue's own last stage.
 */
export const charadeLines = (entry: CharadeEntry, stage: number): { lines: CharadeLine[]; clear?: string } => {
  const groups = charadeSyllableGroups(entry.syllables.length);
  const revealedGroups = groups.slice(0, Math.max(0, Math.min(stage, groups.length)));
  const lines = revealedGroups.map((group, index) => {
    const syllableText = (syllableIndex: number) => entry.syllables[syllableIndex];
    if (group.length === 1) {
      const [syllableIndex] = group;
      const riddle = riddleFor(syllableText(syllableIndex));
      // `groups` never has more entries than `ORDINALS` (both bounded by `CHARADE_SYLLABLE_STAGE_CAP`).
      return { label: ORDINALS[index], text: riddle ?? `se dit « ${syllableText(syllableIndex)} »` };
    }
    return { label: 'mes dernières syllabes', text: group.map(syllableText).join(', ') };
  });
  const clear =
    stage > groups.length
      ? entry.syllables.map((syllable) => syllable.charAt(0).toUpperCase() + syllable.slice(1).toLowerCase()).join('-')
      : undefined;
  return { lines, clear };
};
