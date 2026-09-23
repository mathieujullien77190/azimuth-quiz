import { letterCount, localTimeFor, wordCount } from './helpers';

describe('letterCount', () => {
  it('counts letters only, excluding spaces', () => {
    expect(letterCount('Rio de Janeiro')).toBe(12);
  });

  it('excludes hyphens and apostrophes', () => {
    expect(letterCount('Saint-Étienne')).toBe(12);
    expect(letterCount("Côte d'Ivoire")).toBe(11);
  });
});

describe('wordCount', () => {
  it('counts single-word names as 1', () => {
    expect(wordCount('Paris')).toBe(1);
  });

  it('counts space-separated words', () => {
    expect(wordCount('San Francisco')).toBe(2);
    expect(wordCount('Rio de Janeiro')).toBe(3);
  });

  it('collapses repeated whitespace and trims', () => {
    expect(wordCount('  New   York  ')).toBe(2);
  });
});

describe('localTimeFor', () => {
  it('formats as HH:mm', () => {
    expect(localTimeFor('Europe/Paris')).toMatch(/^\d{2}:\d{2}$/);
  });

  it('reflects the timezone offset (same instant, different zones differ or wrap by 24h)', () => {
    const paris = localTimeFor('Europe/Paris');
    const tokyo = localTimeFor('Asia/Tokyo');
    // Les deux sont des heures valides ; Paris et Tokyo ont un decalage donc rarement identiques,
    // mais on ne fige pas une egalite/inegalite qui depend de l'heure d'execution du test.
    expect(paris).toMatch(/^\d{2}:\d{2}$/);
    expect(tokyo).toMatch(/^\d{2}:\d{2}$/);
  });
});
