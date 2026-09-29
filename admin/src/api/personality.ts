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

// --- The shared job dictionary itself (`data/personalityJobs.json`) — add/rename/delete an ------
// entry, rather than edit a single place's tag. Same journal-only pattern as everything above.

export type JobRow = { code: string; fr: string; en: string; examples: string[] };

/** How many example place names to keep per job (just enough context to judge a rename/delete —
 * not an exhaustive list). Same idea as `SyllablesView`'s own `MAX_EXAMPLES`. */
const MAX_JOB_EXAMPLES = 4;

/** `fr` -> a lowercase, accent-stripped, letters-only 3-letter code (`"chanteuse"` -> `"cha"`) — a
 * starting point, not guaranteed free yet (see `freeJobCode`). */
const codeFromFr = (fr: string): string =>
  fr
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
    .slice(0, 3) || 'job';

/** The first code starting with `base` that isn't already taken — `base` itself if it's free,
 * else `base` + "2", "3"... (there's no natural 3-letter fallback scheme to reuse here, unlike
 * place keys: a handful of jobs added by hand never collides often enough to need one). */
const freeJobCode = (base: string): string => {
  if (!(base in JOBS)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}${n}`;
    if (!(candidate in JOBS)) return candidate;
  }
};

/** Every curated job, its two translations, and which places currently use it (from
 * `personalityPlaces.json` directly, not `CluePlace.personality` — same reasoning as
 * `personalityDraftFor`). Alphabetical by French text. */
export const allJobRows = (): JobRow[] => {
  const examplesByCode = new Map<string, string[]>();
  for (const [name, jobCode] of Object.values(PERSONALITY_PLACES)) {
    if (jobCode === null) continue;
    const examples = examplesByCode.get(jobCode) ?? [];
    if (examples.length < MAX_JOB_EXAMPLES) examples.push(name);
    examplesByCode.set(jobCode, examples);
  }
  return Object.entries(JOBS)
    .map(([code, [fr, en]]) => ({ code, fr, en, examples: examplesByCode.get(code) ?? [] }))
    .sort((a, b) => a.fr.localeCompare(b.fr, 'fr'));
};

/** Matches a job's French text, English text, or one of its example places. */
export const filterJobRows = (rows: JobRow[], query: string): JobRow[] => {
  const q = query.trim().toLowerCase();
  if (q === '') return rows;
  return rows.filter(
    (row) => row.fr.toLowerCase().includes(q) || row.en.toLowerCase().includes(q) || row.examples.some((name) => name.toLowerCase().includes(q)),
  );
};

export const addJob = async (fr: string, en: string): Promise<JobRow> => {
  const code = freeJobCode(codeFromFr(fr));
  logChange(`[Métiers] + personalityJobs.json["${code}"] = ["${fr}", "${en}"]`);
  return { code, fr, en, examples: [] };
};

export const saveJobFr = async (job: JobRow, next: string): Promise<JobRow> => {
  logChange(`[Métiers] personalityJobs.json["${job.code}"][0] : "${job.fr}" -> "${next}"`);
  return { ...job, fr: next };
};

export const saveJobEn = async (job: JobRow, next: string): Promise<JobRow> => {
  logChange(`[Métiers] personalityJobs.json["${job.code}"][1] : "${job.en}" -> "${next}"`);
  return { ...job, en: next };
};

/** Only meaningful (and only ever called by the view) when `job.examples` is empty — deleting a
 * code still referenced by a place would leave its `personalityPlaces.json` row pointing at
 * nothing, so `JobsView` hides the delete action otherwise rather than let that happen. */
export const deleteJob = async (job: JobRow): Promise<void> => {
  logChange(`[Métiers] - personalityJobs.json["${job.code}"] supprimé (« ${job.fr} »)`);
};
