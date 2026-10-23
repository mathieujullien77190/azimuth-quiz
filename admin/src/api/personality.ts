import type { CluePlace } from '@/types';

import { withJobLabel } from '@/data/firestore/denormalizeClues';

import { applyJobChange, data, putJob, putPlace, removeJob } from '../data';

/** Codes de metiers curables, libelle francais d'abord : options du select, triees par texte francais. */
export const jobOptions = (): { code: string; fr: string }[] =>
  Object.entries(data().jobs)
    .map(([code, { fr }]) => ({ code, fr }))
    .sort((a, b) => a.fr.localeCompare(b.fr, 'fr'));

export type PersonalityDraft = { name: string; jobCode: string | null };

/**
 * Personnalite curee de `place` a editer ; l'admin a besoin du code metier brut pour preselectionner le `<select>`.
 */
export const personalityDraftFor = (place: Pick<CluePlace, 'key'>): PersonalityDraft => {
  const { personality } = data().places[place.key];
  return personality ? { name: personality.name, jobCode: personality.jobCode } : { name: '', jobCode: null };
};

/**
 * Vider le nom retire toute l'entree : le jeu offre l'indice `personality` des qu'il y a une entree, un nom vide
 * donnerait une carte vide.
 */
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

// --- Dictionnaire commun des metiers (`personalityJobs`) : ajout/renommage/suppression d'une entree, pas le tag d'un
// lieu ---

export type JobRow = { code: string; fr: string; en: string; examples: string[] };

/** Exemples de noms de lieux gardes par metier (juste assez pour juger un renommage/une suppression). */
const MAX_JOB_EXAMPLES = 4;

/**
 * `fr` -> code de 3 lettres minuscules sans accents (`"chanteuse"` -> `"cha"`) ; point de depart, pas forcement libre
 * (voir `freeJobCode`).
 */
const codeFromFr = (fr: string): string =>
  fr
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
    .slice(0, 3) || 'job';

/** Premier code commencant par `base` encore libre : `base`, sinon `base` + "2", "3"... */
const freeJobCode = (base: string): string => {
  const jobs = data().jobs;
  let candidate = base;
  for (let n = 2; candidate in jobs; n += 1) candidate = `${base}${n}`;
  return candidate;
};

/** Chaque metier cure, ses deux traductions et les lieux qui l'utilisent, tries par texte francais. */
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

/**
 * Appelee seulement quand `job.examples` est vide : supprimer un code encore utilise laisserait une personnalite sans
 * metier, donc `JobsView` masque l'action sinon.
 */
export const deleteJob = async (job: JobRow): Promise<void> => {
  await removeJob(job.code);
};
