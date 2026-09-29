import { wordplayFor, type WordplayEntry } from '@/games/clues/helpers/wordplay';
import type { CluePlace } from '@/types';

import { logChange } from '../changelog';

/** Same no-backend, journal-only pattern as every other admin edit (see `changelog.ts`,
 * `api/charades.ts`) — nothing here is written to `scripts/wordplayCuration.json`, every change
 * just appends a line to copy over by hand. */
const identity = (place: Pick<CluePlace, 'name' | 'code'>): string => `${place.name} (${place.code})`;

/** `place`'s wordplay entry to edit — unlike the game's own `wordplayFor` (which is `null` for an
 * uncurated place, so the clue is never offered), the admin always has something to start typing
 * into: both fields empty until curated by hand. */
export const wordplayEntryFor = (place: Pick<CluePlace, 'name' | 'code'>): WordplayEntry =>
  wordplayFor(place) ?? { sentence: '', explained: '' };

export const saveWordplaySentence = async (
  place: Pick<CluePlace, 'name' | 'code'>,
  entry: WordplayEntry,
  next: string,
): Promise<WordplayEntry> => {
  const trimmed = next.trim();
  logChange(`[Jeu de mots] ${identity(place)} — phrase : « ${entry.sentence || '(vide)'} » -> « ${trimmed || '(vide)'} »`);
  return { ...entry, sentence: trimmed };
};

export const saveWordplayExplained = async (
  place: Pick<CluePlace, 'name' | 'code'>,
  entry: WordplayEntry,
  next: string,
): Promise<WordplayEntry> => {
  const trimmed = next.trim();
  logChange(
    `[Jeu de mots] ${identity(place)} — phrase expliquée : « ${entry.explained || '(vide)'} » -> « ${trimmed || '(vide)'} »`,
  );
  return { ...entry, explained: trimmed };
};
