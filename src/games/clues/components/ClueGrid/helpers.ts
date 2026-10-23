import type { ClueId } from '@/types';

/** Nombre de fois que `clueId` a ete choisi dans la manche (les indices a etapes comptent un clic par etape). */
export const clueStage = (revealedClueIds: ClueId[], clueId: ClueId): number =>
  revealedClueIds.filter((id) => id === clueId).length;

/** Reste-t-il une etape a devoiler pour `clueId` ? Le drapeau fait toujours 3 clics, quel que soit son nombre de couleurs. */
export const clueHasMoreToReveal = (revealedClueIds: ClueId[], clueId: ClueId): boolean => {
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
    default:
      return false;
  }
};

/** `vowels` se debloque quand tous les indices offerts (`cluesFor(place)`) ont ete choisis au moins une fois. */
export const vowelsUnlocked = (revealedClueIds: ClueId[], availableClueIds: ClueId[]): boolean =>
  availableClueIds.every((id) => revealedClueIds.includes(id));
