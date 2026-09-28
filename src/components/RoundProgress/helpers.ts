import type { Difficulty } from '@/types';

export const formatRoundProgress = (roundNumber: number, totalRounds: number): string =>
  `${roundNumber} / ${totalRounds}`;

/** The round's difficulty as its emoji + label ("🟡 Moyen"). */
export const formatDifficulty = (
  id: Difficulty,
  emojiOf: (id: Difficulty) => string,
  labelOf: (id: Difficulty) => string,
): string => `${emojiOf(id)} ${labelOf(id)}`;
