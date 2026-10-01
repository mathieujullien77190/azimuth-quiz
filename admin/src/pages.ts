import { DEFAULT_PAGE, PAGES, type PageId } from './pageList';

export { DEFAULT_PAGE, PAGES, type PageId };

/** The app's base path without its trailing slash (`/azimuth-quiz/admin` once built, empty in dev). */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

/** The page a pathname points to; `/admin/` and any unknown path fall back to the first page. */
export const pageFromPath = (pathname: string): PageId => {
  const rest = pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname;
  const segment = rest.split('/').filter(Boolean)[0];
  return PAGES.find((page) => page.path === segment)?.id ?? DEFAULT_PAGE;
};

export const hrefOf = (id: PageId): string => `${BASE_PATH}/${PAGES.find((page) => page.id === id)!.path}`;
