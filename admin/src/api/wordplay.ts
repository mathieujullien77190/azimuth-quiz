import type { WordplayEntry } from '@/games/clues/helpers/wordplay';
import type { CluePlace, Difficulty } from '@/types';

import { logChange } from '../changelog';
import { DIFFICULTY_LABELS } from '../constants';
import { data, putPlace } from '../data';

/** Logs the human identity AND `place.key` (the document id, opaque on its own) side by side. */
const identity = (place: Pick<CluePlace, 'name' | 'code' | 'key'>): string => `${place.name} (${place.code}) [${place.key}]`;

/** `place`'s wordplay entry to edit — the admin always has something to start typing into: an
 * empty sentence until curated by hand, defaulting to 'intermediate' difficulty. */
export const wordplayEntryFor = (place: Pick<CluePlace, 'key'>): WordplayEntry =>
  data().places[place.key].wordplay ?? { sentence: '', difficulty: 'intermediate' };

const writeEntry = (place: Pick<CluePlace, 'key'>, entry: WordplayEntry) => putPlace(place.key, { ...data().places[place.key], wordplay: entry });

export const saveWordplaySentence = async (
  place: Pick<CluePlace, 'name' | 'code' | 'key'>,
  entry: WordplayEntry,
  next: string,
): Promise<WordplayEntry> => {
  const trimmed = next.trim();
  const updated = { ...entry, sentence: trimmed };
  await writeEntry(place, updated);
  logChange(`[Jeu de mots] ${identity(place)} — phrase : « ${entry.sentence || '(vide)'} » -> « ${trimmed || '(vide)'} »`);
  return updated;
};

export const saveWordplayDifficulty = async (
  place: Pick<CluePlace, 'name' | 'code' | 'key'>,
  entry: WordplayEntry,
  next: Difficulty,
): Promise<WordplayEntry> => {
  const updated = { ...entry, difficulty: next };
  await writeEntry(place, updated);
  logChange(`[Jeu de mots] ${identity(place)} — difficulté : ${DIFFICULTY_LABELS[entry.difficulty]} -> ${DIFFICULTY_LABELS[next]}`);
  return updated;
};
