import { spacing } from '@/constants';
import type { RoundRecord } from '@/types';

import { MAX_COMPASS_SIZE, MAX_EARTH_SIZE } from './constants';

/** Total de points de chaque joueur, dans l'ordre des joueurs. */
export const playerTotals = (records: RoundRecord[], playerCount: number): number[] =>
  Array.from({ length: playerCount }, (_, playerIndex) =>
    records.reduce((total, record) => total + (record.results[playerIndex]?.score.total ?? 0), 0),
  );

// Au tout premier rendu de l'export web statique, `useWindowDimensions` peut renvoyer 0 (valeur
// figee au rendu serveur, jamais corrigee sans redimensionnement reel) : sans garde-fou, boussole
// et Terre se retrouveraient avec une taille negative, donc invisibles. On retombe sur leur
// taille max plutot que de les faire disparaitre.
export const compassSizeFor = (windowWidth: number): number => {
  const size = Math.min(MAX_COMPASS_SIZE, windowWidth - spacing.lg * 2);
  return size > 0 ? size : MAX_COMPASS_SIZE;
};

export const earthSizeFor = (windowWidth: number): number => {
  const size = Math.min(MAX_EARTH_SIZE, windowWidth - spacing.lg * 2 - spacing.md * 2);
  return size > 0 ? size : MAX_EARTH_SIZE;
};

export const formatRoundProgress = (roundNumber: number, totalRounds: number): string =>
  `${roundNumber} / ${totalRounds}`;
