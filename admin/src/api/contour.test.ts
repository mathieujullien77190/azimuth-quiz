import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CountryDoc } from '@/data/firestore/types';
import type { ContourCountry, ContourNeighbor } from '@/types';

const h = vi.hoisted(() => ({
  state: { countries: {} as Record<string, unknown> },
  contours: undefined as unknown as () => unknown,
  putCountry: undefined as unknown as (code: string, doc: unknown) => Promise<void>,
}));

vi.mock('../data', () => ({
  data: () => h.state,
  contours: () => h.contours(),
  putCountry: (code: string, doc: unknown) => h.putCountry(code, doc),
}));

import { allContours, deleteNeighbor, saveCenterLabelPosition, saveNeighborPosition } from './contour';

const doc = (): CountryDoc => ({
  fr: 'Autriche',
  en: 'Austria',
  ring: 'abc',
  difficulty: 'easy',
  centerLabel: { x: 0.5, y: 0.5 },
  neighbors: [
    { code: 'DE', fr: 'Allemagne', en: 'Germany', ring: 'r', x: 0.1, y: 0.2 },
    { code: 'IT', fr: 'Italie', en: 'Italy', x: 0.3, y: 0.4 },
  ],
});

const country = { code: 'AT' } as ContourCountry;
const germany = { type: 'country', code: 'DE', fr: 'Allemagne', en: 'Germany', x: 0.1, y: 0.2 } as ContourNeighbor;

beforeEach(() => {
  h.state.countries = { AT: doc() };
  h.contours = vi.fn(() => []);
  h.putCountry = vi.fn(async () => {});
});

describe('allContours', () => {
  it('returns the silhouettes of the local copy', () => {
    const list = [country];
    h.contours = () => list;

    expect(allContours()).toBe(list);
  });
});

describe('saveNeighborPosition', () => {
  it('moves only the named neighbor and returns it updated', async () => {
    const moved = await saveNeighborPosition(country, germany, { x: 0.7, y: 0.8 });

    expect(moved).toEqual({ ...germany, x: 0.7, y: 0.8 });
    expect(h.putCountry).toHaveBeenCalledWith('AT', {
      ...doc(),
      neighbors: [
        { code: 'DE', fr: 'Allemagne', en: 'Germany', ring: 'r', x: 0.7, y: 0.8 },
        { code: 'IT', fr: 'Italie', en: 'Italy', x: 0.3, y: 0.4 },
      ],
    });
  });
});

describe('deleteNeighbor', () => {
  it('removes the position of the neighbor but keeps its outline and the others', async () => {
    await deleteNeighbor(country, germany);

    expect(h.putCountry).toHaveBeenCalledWith('AT', {
      ...doc(),
      neighbors: [
        { code: 'DE', fr: 'Allemagne', en: 'Germany', ring: 'r' },
        { code: 'IT', fr: 'Italie', en: 'Italy', x: 0.3, y: 0.4 },
      ],
    });
  });
});

describe('saveCenterLabelPosition', () => {
  it('writes the new anchor and returns it', async () => {
    const next = { x: 0.2, y: 0.9 };

    expect(await saveCenterLabelPosition(country, { x: 0.5, y: 0.5 }, next)).toBe(next);
    expect(h.putCountry).toHaveBeenCalledWith('AT', { ...doc(), centerLabel: next });
  });
});
