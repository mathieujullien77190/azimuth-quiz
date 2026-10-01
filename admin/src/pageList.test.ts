import { describe, expect, it } from 'vitest';

import { DEFAULT_PAGE, PAGES } from './pageList';

describe('pageList', () => {
  it('gives every page a distinct id and path', () => {
    expect(new Set(PAGES.map((page) => page.id)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((page) => page.path)).size).toBe(PAGES.length);
  });

  it('opens one of the listed pages by default', () => {
    expect(PAGES.map((page) => page.id)).toContain(DEFAULT_PAGE);
  });
});
