import { CATEGORIES } from '@/constants';
import type { Category } from '@/types';

export const formatRoundProgress = (roundNumber: number, totalRounds: number): string =>
  `${roundNumber} / ${totalRounds}`;

export const categoryEmoji = (category: Category): string =>
  CATEGORIES.find((candidate) => candidate.id === category)?.emoji ?? '📍';
