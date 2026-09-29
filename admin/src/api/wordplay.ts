import { wordplayFor, type WordplayEntry } from '@/games/clues/helpers/wordplay';
import type { CluePlace, Difficulty } from '@/types';

import { logChange } from '../changelog';
import { DIFFICULTY_LABELS } from '../constants';

/** Same no-backend, journal-only pattern as every other admin edit (see `changelog.ts`,
 * `api/charades.ts`) — nothing here is written to `scripts/wordplayCuration.json`, every change
 * just appends a line to copy over by hand. Logs the human identity AND `place.key` (the actual
 * curation key, opaque on its own — see `data/places/codec.ts`'s doc comment) side by side. */
const identity = (place: Pick<CluePlace, 'name' | 'code' | 'key'>): string => `${place.name} (${place.code}) [${place.key}]`;

/** `place`'s wordplay entry to edit — unlike the game's own `wordplayFor` (which is `null` for an
 * uncurated place, so the clue is never offered), the admin always has something to start typing
 * into: an empty sentence until curated by hand, defaulting to 'intermediate' difficulty (same
 * default `scripts/generateWordplay.mjs` falls back to for a missing/invalid value). */
export const wordplayEntryFor = (place: Pick<CluePlace, 'key'>): WordplayEntry => wordplayFor(place) ?? { sentence: '', difficulty: 'intermediate' };

export const saveWordplaySentence = async (
  place: Pick<CluePlace, 'name' | 'code' | 'key'>,
  entry: WordplayEntry,
  next: string,
): Promise<WordplayEntry> => {
  const trimmed = next.trim();
  logChange(`[Jeu de mots] ${identity(place)} — phrase : « ${entry.sentence || '(vide)'} » -> « ${trimmed || '(vide)'} »`);
  return { ...entry, sentence: trimmed };
};

export const saveWordplayDifficulty = async (
  place: Pick<CluePlace, 'name' | 'code' | 'key'>,
  entry: WordplayEntry,
  next: Difficulty,
): Promise<WordplayEntry> => {
  logChange(`[Jeu de mots] ${identity(place)} — difficulté : ${DIFFICULTY_LABELS[entry.difficulty]} -> ${DIFFICULTY_LABELS[next]}`);
  return { ...entry, difficulty: next };
};
