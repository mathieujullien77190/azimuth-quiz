import type { CluePlace } from '@/types';

import { withJobLabel } from '@/data/firestore/denormalizeClues';

import { applyJobChange, data, putJob, putPlace, removeJob } from '../data';

/** All curatable job codes, French label first — the select's options, alphabetical by French text
 * so a curator can scan/find one by eye. */
export const jobOptions = (): { code: string; fr: string }[] =>
  Object.entries(data().jobs)
    .map(([code, { fr }]) => ({ code, fr }))
    .sort((a, b) => a.fr.localeCompare(b.fr, 'fr'));

export type PersonalityDraft = { name: string; jobCode: string | null };

/** `place`'s curated personality to edit — unlike the game's own resolved `CluePlace.personality`,
 * the admin needs the raw job code back to preselect it in the job `<select>`. No curated entry yet
 * -> both fields start blank. */
export const personalityDraftFor = (place: Pick<CluePlace, 'key'>): PersonalityDraft => {
  const { personality } = data().places[place.key];
  return personality ? { name: personality.name, jobCode: personality.jobCode } : { name: '', jobCode: null };
};

/** The name field was edited — clearing it back to empty removes the place's curated entry
 * entirely: the game only offers the `personality` clue when the place HAS an entry at all, so a
 * blank name would leak through as an empty card rather than just not being offered. */
export const savePersonalityName = async (
  place: Pick<CluePlace, 'name' | 'code' | 'key'>,
  draft: PersonalityDraft,
  next: string,
): Promise<PersonalityDraft> => {
  const trimmed = next.trim();
  const rest = { ...data().places[place.key] };
  delete rest.personality;
  if (trimmed === '') {
    await putPlace(place.key, rest);
    return { name: '', jobCode: null };
  }
  await putPlace(
    place.key,
    withJobLabel({ ...rest, personality: { name: trimmed, jobCode: draft.jobCode } }, data().jobs),
  );
  return { ...draft, name: trimmed };
};

export const savePersonalityJob = async (
  place: Pick<CluePlace, 'name' | 'code' | 'key'>,
  draft: PersonalityDraft,
  next: string | null,
): Promise<PersonalityDraft> => {
  await putPlace(
    place.key,
    withJobLabel({ ...data().places[place.key], personality: { name: draft.name, jobCode: next } }, data().jobs),
  );
  return { ...draft, jobCode: next };
};

// --- The shared job dictionary itself (`personalityJobs`) — add/rename/delete an entry, rather ------
// than edit a single place's tag.

export type JobRow = { code: string; fr: string; en: string; examples: string[] };

/** How many example place names to keep per job (just enough context to judge a rename/delete —
 * not an exhaustive list). */
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
 * else `base` + "2", "3"... */
const freeJobCode = (base: string): string => {
  const jobs = data().jobs;
  let candidate = base;
  for (let n = 2; candidate in jobs; n += 1) candidate = `${base}${n}`;
  return candidate;
};

/** Every curated job, its two translations, and which places currently use it. Alphabetical by
 * French text. */
export const allJobRows = (): JobRow[] => {
  const examplesByCode = new Map<string, string[]>();
  for (const { personality } of Object.values(data().places)) {
    if (!personality || personality.jobCode === null) continue;
    const examples = examplesByCode.get(personality.jobCode) ?? [];
    if (examples.length < MAX_JOB_EXAMPLES) examples.push(personality.name);
    examplesByCode.set(personality.jobCode, examples);
  }
  return Object.entries(data().jobs)
    .map(([code, { fr, en }]) => ({ code, fr, en, examples: examplesByCode.get(code) ?? [] }))
    .sort((a, b) => a.fr.localeCompare(b.fr, 'fr'));
};

/** Matches a job's French or English text. */
export const filterJobRows = (rows: JobRow[], query: string): JobRow[] => {
  const q = query.trim().toLowerCase();
  if (q === '') return rows;
  return rows.filter((row) => row.fr.toLowerCase().includes(q) || row.en.toLowerCase().includes(q));
};

export const addJob = async (fr: string, en: string): Promise<JobRow> => {
  const code = freeJobCode(codeFromFr(fr));
  await putJob(code, { fr, en });
  return { code, fr, en, examples: [] };
};

export const saveJobFr = async (job: JobRow, next: string): Promise<JobRow> => {
  await applyJobChange(job.code, { fr: next, en: job.en });
  return { ...job, fr: next };
};

export const saveJobEn = async (job: JobRow, next: string): Promise<JobRow> => {
  await applyJobChange(job.code, { fr: job.fr, en: next });
  return { ...job, en: next };
};

/** Only meaningful (and only ever called by the view) when `job.examples` is empty — deleting a
 * code still referenced by a place would leave its personality pointing at nothing, so `JobsView`
 * hides the delete action otherwise rather than let that happen. */
export const deleteJob = async (job: JobRow): Promise<void> => {
  await removeJob(job.code);
};
