import type { IndicesClueId, IndicesPlace } from '@/types';

export type IndicesClueState = 'locked' | 'revealed';

export type IndicesClueCardProps = {
  clueId: IndicesClueId;
  label: string;
  place: IndicesPlace;
  state: IndicesClueState;
  /** Locked + provided: the card becomes pressable to pick this clue. */
  onPress?: () => void;
  /** Allows re-clicking an already-revealed card (`emoji`/`flagColors` clues, as long as there's
   * still something to reveal: each click counts as a newly picked clue, cost included). */
  moreToReveal?: boolean;
  /** Only for the `bearing`/`distance` clues: heading and distance from the player. */
  bearingDeg?: number;
  distanceKm?: number;
  /** Only for the `emoji` clue: how many of the 3 emoji are already revealed (0-3). */
  emojiStage?: number;
  /** Only for the `flagColors` clue: how many of the flag's colors are already revealed
   * (1 to `countryFlagColors(place.code).length`, see constants/places/countries.ts). */
  flagStage?: number;
  /** Only for the `distance` clue: 1 = heading+distance shown on the globe but the km value
   * hidden ("?" in the middle, re-clickable), 2 = km revealed (same idea as emoji/flagStage). */
  distanceStage?: number;
  /** Only for the `elevation` clue: 1 = tier emoji (see `elevationTierEmoji`), 2 =
   * exact elevation revealed. */
  elevationStage?: number;
  /** Only for the `population` clue: 1 = 5-dot gauge (see `populationTier`), 2 =
   * exact population revealed. */
  populationStage?: number;
  /** Only for the `currency` clue: 1 = symbol (`place.currency`), 2 = full currency
   * name (see `countryCurrencyName` in constants/places/countries.ts). */
  currencyStage?: number;
  /** Only for the `localTime` clue: 1 = day/night emoji (see `dayNightEmoji`), 2 = exact
   * local time revealed. */
  localTimeStage?: number;
  /** Only for the `letter` clue: 1 = first letter alone, 2 = every letter's slot, real length
   * per word. */
  letterStage?: number;
};
