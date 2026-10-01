import { describe, expect, it, vi } from 'vitest';

vi.mock('../../data', () => ({ countryName: (code: string) => `name-${code}` }));

import { neighborIcon, neighborName } from './helpers';

const neighbor = { type: 'country', code: 'FR', x: 0.5, y: 0.5 } as const;

describe('neighbor helpers', () => {
  it('uses the flag emoji of the country code', () => {
    expect(neighborIcon(neighbor)).toBe('🇫🇷');
  });

  it('uses the name of the country', () => {
    expect(neighborName(neighbor)).toBe('name-FR');
  });
});
