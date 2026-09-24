export const wikiUrl = (lang: 'fr' | 'en', slug: string): string => `https://${lang}.wikipedia.org/wiki/${encodeURI(slug.replace(/ /g, '_'))}`;
