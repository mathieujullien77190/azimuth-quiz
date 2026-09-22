import { spacing } from '@/constants';
import type { RoundRecord } from '@/types';

import { MAX_COMPASS_SIZE, MAX_EARTH_SIZE } from './constants';

/** Total de points de chaque joueur, dans l'ordre des joueurs. */
export const playerTotals = (records: RoundRecord[], playerCount: number): number[] =>
  Array.from({ length: playerCount }, (_, playerIndex) =>
    records.reduce((total, record) => total + (record.results[playerIndex]?.score.total ?? 0), 0),
  );

export const compassSizeFor = (windowWidth: number): number =>
  Math.min(MAX_COMPASS_SIZE, windowWidth - spacing.lg * 2);

export const earthSizeFor = (windowWidth: number): number =>
  Math.min(MAX_EARTH_SIZE, windowWidth - spacing.lg * 2 - spacing.md * 2);
