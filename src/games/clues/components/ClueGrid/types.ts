import type { ClueId, CluePlace } from '@/types';

export type ClueGridProps = {
  place: CluePlace;
  bearingDeg: number;
  distanceKm: number;
  revealedClueIds: ClueId[];
  /** Reveal everything, regardless of what's actually in `revealedClueIds` — end-of-round
   * display. */
  roundOver: boolean;
  /** Undefined disables every card — either because the round is over, or (online) because it
   * isn't this device's turn; either way nothing here decides which, it just renders read-only. */
  onPickClue?: (clueId: ClueId) => void;
};
