/**
 * Pages de l'admin : une URL statique chacune (`/admin/places`, `/admin/countries`...) pour les ouvrir ou les mettre
 * en favori. `/admin/` est la premiere. Le build ecrit un `index.html` par `path` (voir `vite.config.ts`).
 */
export const PAGES = [
  { id: 'places', path: 'places', label: 'Lieux' },
  { id: 'countries', path: 'countries', label: 'Pays' },
  { id: 'globe', path: 'globe', label: 'Monde' },
  { id: 'errors', path: 'errors', label: 'Erreurs' },
] as const;

export type PageId = (typeof PAGES)[number]['id'];

export const DEFAULT_PAGE: PageId = 'places';
