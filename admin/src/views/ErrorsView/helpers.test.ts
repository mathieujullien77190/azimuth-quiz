import { describe, expect, it } from 'vitest';

import { formatDate, groupErrors } from './helpers';
import type { ErrorRow } from './types';

const row = (over: Partial<ErrorRow>): ErrorRow => ({
  id: 'x',
  action: 'a',
  code: 'c',
  message: '',
  room: null,
  kind: 'game',
  repeats: 0,
  platform: 'web',
  version: '1',
  at: 0,
  expireAt: 0,
  ...over,
});

describe('groupErrors', () => {
  it('groups by action and code, adding counts, repeats and the latest date', () => {
    const groups = groupErrors([row({ at: 5, repeats: 2 }), row({ at: 9 }), row({ action: 'b', at: 1 })]);
    expect(groups).toContainEqual({ action: 'a', code: 'c', count: 2, repeats: 2, lastAt: 9 });
    expect(groups).toContainEqual({ action: 'b', code: 'c', count: 1, repeats: 0, lastAt: 1 });
  });

  it('sorts by occurrences including repeats, then by latest date', () => {
    const groups = groupErrors([
      row({ action: 'few', at: 10 }),
      row({ action: 'many', repeats: 5, at: 1 }),
      row({ action: 'tie', at: 20 }),
    ]);
    expect(groups.map((g) => g.action)).toEqual(['many', 'tie', 'few']);
  });
});

describe('formatDate', () => {
  it('formats in French with seconds', () => {
    expect(formatDate(new Date(2026, 0, 2, 3, 4, 5).getTime())).toMatch(/02\/01.*03:04:05/);
  });
});
