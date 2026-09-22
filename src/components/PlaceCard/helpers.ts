import { CATEGORIES } from '@/constants';
import type { Category } from '@/types';

export const categoryEmoji = (category: Category): string =>
  CATEGORIES.find((candidate) => candidate.id === category)?.emoji ?? '📍';
