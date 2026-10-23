import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { spacing } from '@/data';
import { DISTANCE_MARKS_KM } from '@/games/constants';
import { formatDistance, kmToRatio } from '@/helpers';
import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { Guess, Place, PlayerResult, RoundRecord, RoundScore } from '@/types';

import { MAX_COMPASS_SIZE, MAX_EARTH_SIZE, ZERO_SCORE } from './constants';

/**
 * Assemble le `RoundRecord` d'une manche (lieu + un resultat par joueur, ordre `onlinePlayers`) depuis les
 * maps brutes `guesses`/`scores`, identique sur chaque appareil.
 */
export const buildRoundRecord = (
  place: Place,
  onlinePlayers: OnlinePlayer[],
  guesses: Record<string, Guess>,
  scores: Record<string, RoundScore>,
): RoundRecord => ({
  place,
  results: onlinePlayers.map(({ uid }): PlayerResult => {
    const guess = guesses[uid] ?? { bearing: 0, distanceKm: 0 };
    const score = scores[uid] ?? ZERO_SCORE;
    return { guess, score };
  }),
});

// Marge (px) pour qu'un defilement manuel compte comme "haut"/"bas" atteint : tolere l'elan et le rebond.
const SCROLL_EDGE_THRESHOLD_PX = 24;

/**
 * Dit si un defilement place la manche sur le cap ou la distance ; `null` entre les deux (le bouton garde
 * son libelle). Aligne `FooterNav` sur la position reelle.
 */
export const onCapFromScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): boolean | null => {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  if (contentOffset.y <= SCROLL_EDGE_THRESHOLD_PX) return false;
  if (contentOffset.y + layoutMeasurement.height >= contentSize.height - SCROLL_EDGE_THRESHOLD_PX) return true;
  return null;
};

// Au 1er rendu de l'export web statique, `useWindowDimensions` peut valoir 0 (fige cote serveur) : boussole
// et Terre auraient une taille negative. On retombe sur leur taille max.
export const compassSizeFor = (windowWidth: number): number => {
  const size = Math.min(MAX_COMPASS_SIZE, windowWidth - spacing.lg * 2);
  return size > 0 ? size : MAX_COMPASS_SIZE;
};

export const earthSizeFor = (windowWidth: number): number => {
  const size = Math.min(MAX_EARTH_SIZE, windowWidth - spacing.lg * 2 - spacing.md * 2);
  return size > 0 ? size : MAX_EARTH_SIZE;
};

/**
 * Reperes sous le curseur de distance (`SliderTrack`) : distances fixes qui tiennent sous le maximum, a
 * leur position logarithmique.
 */
export const distanceSliderMarks = (maxKm: number) =>
  DISTANCE_MARKS_KM.filter((km) => km < maxKm).map((km) => ({
    ratio: kmToRatio(km, maxKm),
    label: formatDistance(km),
  }));
