import type { JournalChange } from './types';

/**
 * The admin keeps a local copy of the data; every write it makes adds an entry to the `journal` collection
 * (same batch as the data, see `admin/src/data.ts`). A sync then reads the entries newer than its last one and
 * re-reads only the documents they name, instead of the whole database. Pure helpers, the admin does the reads.
 */

/** The documents to re-read for `entries` (oldest first): each document once, with its LAST operation —
 * written then deleted is a delete, deleted then written is a write. */
export const collapseJournal = (entries: JournalChange[][]): JournalChange[] => {
  const last = new Map<string, JournalChange>();
  for (const change of entries.flat()) last.set(`${change.c}/${change.id}`, change);
  return [...last.values()];
};
