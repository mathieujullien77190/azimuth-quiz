import type { Language } from '@/i18n';
import type { ThemeId } from '@/types';

// Version affichee dans « A propos » : voir `@/helpers/appInfo` (app.json, avec l'animal de la version, skill `push`) ;
// la ligne est construite par `versionLabel`.
export { APP_CODENAME, APP_VERSION_NUMBER } from '@/helpers/appInfo';

export const LANGUAGES: Language[] = ['fr', 'en'];
export const THEME_IDS: ThemeId[] = ['night', 'day'];
