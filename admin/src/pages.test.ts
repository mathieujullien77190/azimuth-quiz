import { afterEach, describe, expect, it, vi } from 'vitest';

import { BASE_PATH, DEFAULT_PAGE, hrefOf, pageFromPath, PAGES } from './pages';

describe('pageFromPath', () => {
  it('opens the first page on the bare admin url and on an unknown path', () => {
    expect(pageFromPath(`${BASE_PATH}/`)).toBe(DEFAULT_PAGE);
    expect(pageFromPath(`${BASE_PATH}/nope`)).toBe(DEFAULT_PAGE);
  });

  it('finds every page by its path, with or without a trailing slash', () => {
    for (const { id, path } of PAGES) {
      expect(pageFromPath(`${BASE_PATH}/${path}`)).toBe(id);
      expect(pageFromPath(`${BASE_PATH}/${path}/`)).toBe(id);
    }
  });

  it('reads a pathname that does not start with the base path as it is', async () => {
    vi.stubEnv('BASE_URL', '/azimuth-quiz/admin/');
    vi.resetModules();
    const built = await import('./pages');
    expect(built.BASE_PATH).toBe('/azimuth-quiz/admin');
    expect(built.pageFromPath('/azimuth-quiz/admin/countries')).toBe('countries');
    expect(built.pageFromPath('/countries')).toBe('countries');
    expect(built.hrefOf('jobs')).toBe('/azimuth-quiz/admin/jobs');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe('hrefOf', () => {
  it('builds the static url of a page', () => {
    expect(hrefOf('countries')).toBe(`${BASE_PATH}/countries`);
  });
});
