/** The admin's pages: one static URL each (`/admin/places`, `/admin/countries`...), so a page can be opened or bookmarked
 * directly. `/admin/` itself is the first one. The production build writes one `index.html` per `path` (see
 * `vite.config.ts`): GitHub Pages has no fallback to the app's single page. */
export const PAGES = [
  { id: 'places', path: 'places', label: 'Lieux' },
  { id: 'countries', path: 'countries', label: 'Pays' },
  { id: 'jobs', path: 'jobs', label: 'Métiers' },
  { id: 'wordplay', path: 'wordplay', label: 'Jeux de mots' },
  { id: 'errors', path: 'errors', label: 'Erreurs' },
] as const;

export type PageId = (typeof PAGES)[number]['id'];

export const DEFAULT_PAGE: PageId = 'places';
