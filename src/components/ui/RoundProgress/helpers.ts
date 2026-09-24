import type { Difficulty } from '@/types';

export const formatRoundProgress = (roundNumber: number, totalRounds: number): string =>
  `${roundNumber} / ${totalRounds}`;

/** A single active difficulty shows its emoji + label ("🟡 Moyen"): with several selected at
 * once (Boussole allows it, Indices never does), just the emojis, run together, to stay compact. */
export const formatDifficulties = (
  ids: Difficulty[],
  emojiOf: (id: Difficulty) => string,
  labelOf: (id: Difficulty) => string,
): string => (ids.length === 1 ? `${emojiOf(ids[0])} ${labelOf(ids[0])}` : ids.map(emojiOf).join(''));
