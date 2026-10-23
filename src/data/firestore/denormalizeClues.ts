import { sameJson } from './same';
import type { JobDoc, PlaceDoc } from './types';

/** Comme `denormalize.ts`, pour le libelle du metier de la personnalite (`personality.job`) copie dans le lieu. Pur. */

/** `place` avec le libelle du metier a jour selon `jobs`. */
export const withJobLabel = (place: PlaceDoc, jobs: Record<string, JobDoc>): PlaceDoc => {
  const { personality } = place;
  if (!personality) return place;
  const { job: _previous, ...rest } = personality;
  const job = personality.jobCode ? jobs[personality.jobCode] : undefined;
  return { ...place, personality: { ...rest, ...(job && { job: { fr: job.fr, en: job.en } }) } };
};

/** Lieux a reecrire quand le metier `code` devient `job`. */
export const planJobChange = (code: string, job: JobDoc, places: Record<string, PlaceDoc>): Record<string, PlaceDoc> =>
  Object.fromEntries(
    Object.entries(places)
      .filter(([, place]) => place.personality?.jobCode === code)
      .map(([key, place]) => [key, withJobLabel(place, { [code]: job })] as const)
      .filter(([key, place]) => !sameJson(place, places[key])),
  );
