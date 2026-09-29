import personalityJobsData from '@/data/personalityJobs.json';
import personalityPlacesData from '@/data/places/personalityPlaces.json';
import type { CluePlace } from '@/types';

import { logChange } from '../changelog';

type PersonalityJobRow = readonly [fr: string, en: string];
const JOBS = personalityJobsData as unknown as Record<string, PersonalityJobRow>;

type PersonalityRow = readonly [name: string, jobCode: string | null];
const PERSONALITY_PLACES = personalityPlacesData as unknown as Record<string, PersonalityRow>;

/** Same no-backend, journal-only pattern as every other admin edit (see `changelog.ts`,
 * `api/charades.ts`, `api/wordplay.ts`) — nothing here is written to `personalityPlaces.json`,
 * every change just appends a line to copy over by hand. Logs the human identity AND `place.key`
 * side by side (see `data/places/codec.ts`'s doc comment: the key alone is opaque). */
const identity = (place: Pick<CluePlace, 'name' | 'code' | 'key'>): string => `${place.name} (${place.code}) [${place.key}]`;

/** All curatable job codes, French label first (`data/personalityJobs.json`) — the select's
 * options, alphabetical by French text so a curator can scan/find one by eye. */
export const JOB_OPTIONS: { code: string; fr: string }[] = Object.entries(JOBS)
  .map(([code, [fr]]) => ({ code, fr }))
  .sort((a, b) => a.fr.localeCompare(b.fr, 'fr'));

export type PersonalityDraft = { name: string; jobCode: string | null };

/** `place`'s curated personality to edit — unlike the game's own `personalityFor` (which reads
 * the job code already resolved to French text), the admin needs the raw code back to preselect
 * it in the job `<select>`, so this reads `personalityPlaces.json` directly rather than going
 * through `CluePlace.personality`. No curated row yet -> both fields start blank. */
export const personalityDraftFor = (place: Pick<CluePlace, 'key'>): PersonalityDraft => {
  const row = PERSONALITY_PLACES[place.key];
  return row ? { name: row[0], jobCode: row[1] } : { name: '', jobCode: null };
};

const jobLabel = (jobCode: string | null): string => (jobCode !== null ? JOBS[jobCode][0] : '(aucun)');

/** The name field was edited — clearing it back to empty removes the place's curated entry
 * entirely (same convention as `saveWordplaySentence`'s empty sentence): `cluesFor` only offers
 * the `personality` clue when `PERSONALITY_PLACES` HAS a row for the key at all, so a row with a
 * blank name would leak through as an empty card rather than just not being offered. */
export const savePersonalityName = async (place: Pick<CluePlace, 'name' | 'code' | 'key'>, draft: PersonalityDraft, next: string): Promise<PersonalityDraft> => {
  const trimmed = next.trim();
  if (trimmed === '') {
    logChange(`[Personnalité] ${identity(place)} — supprimé -> personalityPlaces.json[${place.key}] retiré`);
    return { name: '', jobCode: null };
  }
  logChange(
    `[Personnalité] ${identity(place)} — nom : « ${draft.name || '(vide)'} » -> « ${trimmed} » -> personalityPlaces.json[${place.key}] = ["${trimmed}", ${draft.jobCode ? `"${draft.jobCode}"` : 'null'}]`,
  );
  return { ...draft, name: trimmed };
};

export const savePersonalityJob = async (
  place: Pick<CluePlace, 'name' | 'code' | 'key'>,
  draft: PersonalityDraft,
  next: string | null,
): Promise<PersonalityDraft> => {
  logChange(
    `[Personnalité] ${identity(place)} — métier : ${jobLabel(draft.jobCode)} -> ${jobLabel(next)} -> personalityPlaces.json[${place.key}] = ["${draft.name}", ${next ? `"${next}"` : 'null'}]`,
  );
  return { ...draft, jobCode: next };
};
