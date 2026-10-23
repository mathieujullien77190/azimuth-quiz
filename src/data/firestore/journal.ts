import type { JournalChange } from './types';

/** Chaque ecriture de l'admin ajoute une entree `journal` (meme lot) : une synchro ne relit que les documents nommes. Pur. */

/** Documents a relire pour `entries` (plus ancienne d'abord) : chacun une fois, avec sa DERNIERE operation. */
export const collapseJournal = (entries: JournalChange[][]): JournalChange[] => {
  const last = new Map<string, JournalChange>();
  for (const change of entries.flat()) last.set(`${change.c}/${change.id}`, change);
  return [...last.values()];
};
