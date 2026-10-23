import type { CluePlace } from '@/types';

/** Personne reelle documentee sur Wikipedia, liee au lieu ; `description` = etiquette courte (ex. "footballeur"), absente
 * si rien de sur a ajouter. Curee a la main dans l'admin (`places/{id}.personality`) : rien n'est jamais invente. */
export type PersonalityEntry = { name: string; description: string | null };

/** Personnalite curee de `place`, ou `null` : alors l'indice `personality` n'est jamais offert (voir `cluesFor`). */
export const personalityFor = (place: Pick<CluePlace, 'personality'>): PersonalityEntry | null =>
  place.personality ?? null;
