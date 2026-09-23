import type { Place } from '@/types';

import { categoryEmoji, wikiUrl } from './helpers';

describe('categoryEmoji', () => {
  it('returns the emoji for a known category', () => {
    expect(categoryEmoji('mountains')).toBe('⛰️');
  });

  it('falls back to a pin emoji for an unknown category (defensive default)', () => {
    expect(categoryEmoji('bogus' as Place['category'])).toBe('📍');
  });
});

describe('wikiUrl', () => {
  it('builds the URL from the preferred language slug', () => {
    expect(wikiUrl({ wikiFr: 'Paris', wikiEn: 'Paris_en' }, 'fr')).toBe('https://fr.wikipedia.org/wiki/Paris');
    expect(wikiUrl({ wikiFr: 'Paris', wikiEn: 'Paris_en' }, 'en')).toBe('https://en.wikipedia.org/wiki/Paris_en');
  });

  it('falls back to the other language slug when the preferred one is missing', () => {
    expect(wikiUrl({ wikiEn: 'Paris_en' }, 'fr')).toBe('https://en.wikipedia.org/wiki/Paris_en');
    expect(wikiUrl({ wikiFr: 'Paris' }, 'en')).toBe('https://fr.wikipedia.org/wiki/Paris');
  });

  it('returns undefined when neither slug is set', () => {
    expect(wikiUrl({}, 'fr')).toBeUndefined();
  });
});
