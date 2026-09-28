import { CLUE_ORDER } from '@/games/clues/constants';
import type { ClueId } from '@/types';

/** How many times `clueId` has been picked so far this round — most clues cost one pick each, but
 * a handful reveal in stages (emoji: 3 clicks; flag: always 3; distance/elevation/population/
 * currency/localTime/letter: 2), each extra click on the already-revealed card counting as one
 * more picked clue. */
export const clueStage = (revealedClueIds: ClueId[], clueId: ClueId): number =>
  revealedClueIds.filter((id) => id === clueId).length;

/** Whether `clueId` still has another stage to reveal — the card stays pickable past its current
 * stage until this turns false. Flag always maxes out at 3 clicks regardless of how many colors
 * the flag actually has (1 color, then every color, then the actual flag). */
export const clueHasMoreToReveal = (revealedClueIds: ClueId[], clueId: ClueId): boolean => {
  const stage = clueStage(revealedClueIds, clueId);
  switch (clueId) {
    case 'emoji':
    case 'flagColors':
      return stage < 3;
    case 'distance':
    case 'elevation':
    case 'population':
    case 'currency':
    case 'localTime':
    case 'letter':
      return stage < 2;
    default:
      return false;
  }
};

/** `vowels` isn't a normal clue (see its own doc comment in `types/index.ts`): it only unlocks
 * once every other clue has been picked at least once. */
export const vowelsUnlocked = (revealedClueIds: ClueId[]): boolean =>
  CLUE_ORDER.every((id) => revealedClueIds.includes(id));
