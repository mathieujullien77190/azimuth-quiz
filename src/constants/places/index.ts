import type { Place } from '@/types';

import { CITIES } from './cities';
import { LANDMARKS } from './landmarks';
import { MOUNTAINS } from './mountains';
import { NATURE } from './nature';

export const PLACES: Place[] = [...CITIES, ...MOUNTAINS, ...LANDMARKS, ...NATURE];
