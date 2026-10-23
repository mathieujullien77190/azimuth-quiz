import { DEFAULT_PAGE, PAGES, type PageId } from './pageList';

export { DEFAULT_PAGE, PAGES, type PageId };

/** Chemin de base de l'app sans slash final (`/azimuth-quiz/admin` en build, vide en dev). */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Page d'un chemin ; `/admin/` et tout chemin inconnu retombent sur la premiere. */
export const pageFromPath = (pathname: string): PageId => {
  const rest = pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname;
  const segment = rest.split('/').filter(Boolean)[0];
  return PAGES.find((page) => page.path === segment)?.id ?? DEFAULT_PAGE;
};

export const hrefOf = (id: PageId): string => `${BASE_PATH}/${PAGES.find((page) => page.id === id)!.path}`;
