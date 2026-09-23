import { CATEGORIES } from '@/constants';
import type { Language } from '@/i18n';
import type { Category, Place } from '@/types';

export const categoryEmoji = (category: Category): string =>
  CATEGORIES.find((candidate) => candidate.id === category)?.emoji ?? '📍';

/** URL Wikipedia complete pour la langue courante, avec repli sur l'autre langue si seule celle-la
 * est renseignee pour ce lieu (mieux qu'aucun lien). `undefined` si aucune des deux ne l'est. */
export const wikiUrl = (place: Pick<Place, 'wikiEn' | 'wikiFr'>, language: Language): string | undefined => {
  const preferredSlug = language === 'fr' ? place.wikiFr : place.wikiEn;
  if (preferredSlug !== undefined) return `https://${language}.wikipedia.org/wiki/${preferredSlug}`;

  const fallbackLanguage: Language = language === 'fr' ? 'en' : 'fr';
  const fallbackSlug = language === 'fr' ? place.wikiEn : place.wikiFr;
  return fallbackSlug !== undefined ? `https://${fallbackLanguage}.wikipedia.org/wiki/${fallbackSlug}` : undefined;
};
