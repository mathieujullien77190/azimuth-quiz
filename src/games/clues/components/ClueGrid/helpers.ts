import { charadeFor, charadeMaxStage } from '@/games/clues/helpers/charade';
import type { ClueId, CluePlace } from '@/types';

/** How many times `clueId` has been picked so far this round — most clues cost one pick each, but
 * a handful reveal in stages (emoji: 3 clicks; flag: always 3; distance/elevation/population/
 * currency/localTime/letter: 2; charade: as many as it has syllable-groups, see `charadeFor`),
 * each extra click on the already-revealed card counting as one more picked clue. */
export const clueStage = (revealedClueIds: ClueId[], clueId: ClueId): number =>
  revealedClueIds.filter((id) => id === clueId).length;

/** Whether `clueId` still has another stage to reveal for `place` — the card stays pickable past
 * its current stage until this turns false. Flag always maxes out at 3 clicks regardless of how
 * many colors the flag actually has (1 color, then every color, then the actual flag); charade's
 * own max depends on `place`'s own syllable count (capped, see `charadeMaxStage`). */
export const clueHasMoreToReveal = (revealedClueIds: ClueId[], clueId: ClueId, place: CluePlace): boolean => {
  const stage = clueStage(revealedClueIds, clueId);
  switch (clueId) {
    case 'emoji':
    case 'flagColors':
      return stage < 3;
    case 'distance':
    case 'globe':
    case 'elevation':
    case 'population':
    case 'currency':
    case 'localTime':
    case 'letter':
      return stage < 2;
    case 'charade':
      return stage < charadeMaxStage(charadeFor(place));
    default:
      return false;
  }
};

/** `vowels` isn't a normal clue (see its own doc comment in `types/index.ts`): it only unlocks
 * once every clue actually offered for this round (`cluesFor(place)` — a `citiesFr` place, or one
 * with no curated `personality`, offers fewer than the full `CLUE_ORDER`) has been picked at
 * least once. */
export const vowelsUnlocked = (revealedClueIds: ClueId[], availableClueIds: ClueId[]): boolean =>
  availableClueIds.every((id) => revealedClueIds.includes(id));
