import { randomCluePlace } from '@/games/clues/helpers/clueGame';
import { getCachedClueHistory, recordClueDraw } from '@/games/clues/helpers/clueHistory';
import type { Language } from '@/i18n';
import type { ClueCategory, CluePlace, Difficulty } from '@/types';

/** Host-only, once at game start (online) — draws every round's place upfront, same pool/history
 * logic as the local game's per-round draw (`randomCluePlace`/`recordClueDraw`), just called
 * `rounds` times in a row instead of once per round: the same pattern Compass' own `pickPlaces`
 * uses for its `RoomGamePayload`. Only the host's device ever consults its draw history for this
 * — no need to sync it, exactly as today for the local/solo game. */
export const pickClueRoundPlaces = (
  rounds: number,
  difficulty: Difficulty,
  categories: ClueCategory[],
  language: Language,
): CluePlace[] =>
  Array.from({ length: rounds }, () => {
    const place = randomCluePlace(difficulty, categories, language, getCachedClueHistory() ?? {});
    recordClueDraw(place);
    return place;
  });
