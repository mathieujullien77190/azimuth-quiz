import { spacing } from '@/constants';

import { MAX_COMPASS_SIZE } from './constants';

export const compassSizeFor = (windowWidth: number): number =>
  Math.min(MAX_COMPASS_SIZE, windowWidth - spacing.xl * 2);
