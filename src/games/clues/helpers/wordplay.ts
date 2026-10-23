import type { CluePlace, Difficulty } from '@/types';

/**
 * Jeu de mots sur le nom du lieu, une phrase devoilee en un clic. `difficulty` (propre au jeu de mots, pas celle du lieu)
 * s'affiche en pastille et ne conditionne jamais l'offre de l'indice. Cure a la main dans l'admin, rien n'est invente :
 * sans curation (ou `sentence` vide), l'indice n'est jamais offert (voir `cluesFor`).
 * Stocke sur le lieu (`places/{id}.wordplay`) et copie dans le `CluePlace` tire, donc une manche ne lit rien d'autre.
 */
export type WordplayEntry = { sentence: string; difficulty: Difficulty };

/** Jeu de mots cure de `place`, ou `null` (jamais de carte vide). */
export const wordplayFor = (place: Pick<CluePlace, 'wordplay'>): WordplayEntry | null =>
  place.wordplay !== undefined && place.wordplay.sentence.trim() !== '' ? place.wordplay : null;
