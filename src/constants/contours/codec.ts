import type { ContourCountry } from '@/types';

import contoursData from './contours.json';

const CONTOURS_RAW = contoursData as unknown as Record<string, [number, number][]>;

export const decodeContours = (raw: Record<string, [number, number][]>): ContourCountry[] =>
  Object.entries(raw).map(([code, points]) => ({ code, points }));

export const CONTOURS: ContourCountry[] = decodeContours(CONTOURS_RAW);
