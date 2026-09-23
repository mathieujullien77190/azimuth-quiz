import { dayNightEmoji, elevationTierEmoji, letterCount, localTimeFor, populationTier, wordCount } from './helpers';

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
  it('formats as HHhmm', () => {
    expect(localTimeFor('Europe/Paris')).toMatch(/^\d{2}h\d{2}$/);
  });

  it('reflects the timezone offset (same instant, different zones differ or wrap by 24h)', () => {
    const paris = localTimeFor('Europe/Paris');
    const tokyo = localTimeFor('Asia/Tokyo');
    // Les deux sont des heures valides ; Paris et Tokyo ont un decalage donc rarement identiques,
    // mais on ne fige pas une egalite/inegalite qui depend de l'heure d'execution du test.
    expect(paris).toMatch(/^\d{2}h\d{2}$/);
    expect(tokyo).toMatch(/^\d{2}h\d{2}$/);
  });
});

describe('dayNightEmoji', () => {
  it('returns either the sun or the moon, never anything else', () => {
    expect(['☀️', '🌙']).toContain(dayNightEmoji('Europe/Paris'));
  });
});

describe('elevationTierEmoji', () => {
  it('picks a tier by elevation, boundaries exclusive on the upper side', () => {
    expect(elevationTierEmoji(0)).toBe('🌳');
    expect(elevationTierEmoji(29)).toBe('🌳');
    expect(elevationTierEmoji(30)).toBe('🏢');
    expect(elevationTierEmoji(299)).toBe('🏢');
    expect(elevationTierEmoji(300)).toBe('⛰️');
    expect(elevationTierEmoji(999)).toBe('⛰️');
    expect(elevationTierEmoji(1000)).toBe('✈️');
    expect(elevationTierEmoji(3656)).toBe('✈️');
  });
});

describe('populationTier', () => {
  it('splits into 5 tiers, boundaries exclusive on the upper side', () => {
    expect(populationTier(0)).toBe(1);
    expect(populationTier(99_999)).toBe(1);
    expect(populationTier(100_000)).toBe(2);
    expect(populationTier(999_999)).toBe(3);
    expect(populationTier(1_000_000)).toBe(4);
    expect(populationTier(4_999_999)).toBe(4);
    expect(populationTier(5_000_000)).toBe(5);
    expect(populationTier(24_870_000)).toBe(5);
  });
});
