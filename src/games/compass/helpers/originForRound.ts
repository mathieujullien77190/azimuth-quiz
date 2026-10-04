import type { Coordinates, Origin, Place } from '@/types';

/** What the round's start depends on: the room's starting point, the drawn places and which round is being played. */
type RoundOrigin = { origin: Origin | null; places: Place[]; roundIndex: number };

/**
 * Where a round is played from: the room's starting point, or — in travel mode, from the second round on — the place
 * of the previous round (the player has "travelled" there). The one place the start is read, so scoring, the true
 * heading and distance, the globe and the reveal can never disagree. Null until the room has delivered its origin.
 * `travel` is `undefined` for a room made before the option existed: off.
 */
export const originForRound = ({ origin, places, roundIndex }: RoundOrigin, travel: boolean | undefined): Coordinates | null => {
  if (origin === null) return null;
  const previous = places[roundIndex - 1];
  return travel === true && previous !== undefined ? previous.coordinates : origin.coordinates;
};

/** The place a travel-mode round starts from, to name it for the player; undefined on the first round or without travel. */
export const travelFromPlace = (
  { places, roundIndex }: Pick<RoundOrigin, 'places' | 'roundIndex'>,
  travel: boolean | undefined,
): Place | undefined => (travel === true ? places[roundIndex - 1] : undefined);

/**
 * The draw with no place right after itself: in travel mode a round starts from the previous place, so two identical
 * places in a row would be a round of distance zero. The draw only repeats a place once a whole group has been gone
 * through (more rounds than places), which is rare, but cheap to guard: the repeat is swapped with the next different
 * place (or left if there is none, e.g. every round the same place).
 */
export const separateRepeats = (places: Place[]): Place[] => {
  const result = [...places];
  for (let index = 1; index < result.length; index += 1) {
    if (result[index].name !== result[index - 1].name) continue;
    const other = result.findIndex((place, at) => at > index && place.name !== result[index - 1].name);
    if (other !== -1) [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};
