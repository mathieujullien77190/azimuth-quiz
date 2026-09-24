import { DEFAULT_SETTINGS, NAME_PLACEHOLDERS } from '@/constants';

import { playerDisplayName, sanitizeSettings } from './settings';

describe('playerDisplayName', () => {
  it('returns the trimmed name when non-empty', () => {
    expect(playerDisplayName('  Mathieu  ', 0)).toBe('Mathieu');
  });

  it('falls back to a placeholder chosen by index when the name is blank', () => {
    expect(playerDisplayName('', 0)).toBe(NAME_PLACEHOLDERS[0]);
    expect(playerDisplayName('   ', 1)).toBe(NAME_PLACEHOLDERS[1]);
  });

  it('wraps around the placeholder list for large indices', () => {
    expect(playerDisplayName('', NAME_PLACEHOLDERS.length)).toBe(NAME_PLACEHOLDERS[0]);
  });
});

describe('sanitizeSettings', () => {
  it('returns DEFAULT_SETTINGS when raw is not an object', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it('returns DEFAULT_SETTINGS entirely when raw is an empty object', () => {
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid playerNames, capped at MAX_PLAYERS and filtered to strings', () => {
    const raw = { playerNames: ['Alice', 42, 'Bob', 'Cara', 'Dan', 'Eve', 'Fay', 'Gus'] };
    const result = sanitizeSettings(raw);
    expect(result.playerNames).toEqual(['Alice', 'Bob', 'Cara', 'Dan', 'Eve', 'Fay']);
  });

  it('falls back to DEFAULT_SETTINGS.playerNames when fewer than MIN_PLAYERS remain', () => {
    const result = sanitizeSettings({ playerNames: [42, false] });
    expect(result.playerNames).toEqual(DEFAULT_SETTINGS.playerNames);
  });

  it('keeps only valid category ids, ignoring unknown ones', () => {
    const result = sanitizeSettings({ categories: ['cities', 'not-a-category', 'mountains'] });
    expect(result.categories).toEqual(['cities', 'mountains']);
  });

  it('falls back to DEFAULT_SETTINGS.categories when none are valid', () => {
    const result = sanitizeSettings({ categories: ['bogus'] });
    expect(result.categories).toEqual(DEFAULT_SETTINGS.categories);
  });

  it('keeps only the first valid difficulty (single choice)', () => {
    const result = sanitizeSettings({ difficulties: ['bogus', 'hard', 'easy'] });
    expect(result.difficulties).toEqual(['hard']);
  });

  it('falls back to DEFAULT_SETTINGS.difficulties when none are valid', () => {
    const result = sanitizeSettings({ difficulties: ['bogus'] });
    expect(result.difficulties).toEqual(DEFAULT_SETTINGS.difficulties);
  });

  it('keeps a valid rounds option, falls back otherwise', () => {
    expect(sanitizeSettings({ rounds: 15 }).rounds).toBe(15);
    expect(sanitizeSettings({ rounds: 7 }).rounds).toBe(DEFAULT_SETTINGS.rounds);
  });

  it('migrates the old two-flag straightDistance/straightDirection into straightLine', () => {
    expect(sanitizeSettings({ straightDistance: true }).straightLine).toBe(true);
    expect(sanitizeSettings({ straightDirection: true }).straightLine).toBe(true);
    expect(sanitizeSettings({}).straightLine).toBe(false);
  });

  it('keeps an explicit straightLine flag over the legacy migration', () => {
    expect(sanitizeSettings({ straightLine: true, straightDistance: false }).straightLine).toBe(true);
  });

  it('keeps boolean flags when present, falls back to defaults for non-booleans', () => {
    const result = sanitizeSettings({ useGps: false, showCountry: 'yes', allowRevision: true, hideOtherAnswers: 1 });
    expect(result.useGps).toBe(false);
    expect(result.showCountry).toBe(DEFAULT_SETTINGS.showCountry);
    expect(result.allowRevision).toBe(true);
    expect(result.hideOtherAnswers).toBe(DEFAULT_SETTINGS.hideOtherAnswers);
  });

  it('keeps custom coordinates within range, falls back otherwise', () => {
    const result = sanitizeSettings({ customLatitude: 10, customLongitude: 20 });
    expect(result.customLatitude).toBe(10);
    expect(result.customLongitude).toBe(20);
  });

  it('falls back to defaults for out-of-range or non-finite coordinates', () => {
    expect(sanitizeSettings({ customLatitude: 200 }).customLatitude).toBe(DEFAULT_SETTINGS.customLatitude);
    expect(sanitizeSettings({ customLongitude: -200 }).customLongitude).toBe(DEFAULT_SETTINGS.customLongitude);
    expect(sanitizeSettings({ customLatitude: Infinity }).customLatitude).toBe(DEFAULT_SETTINGS.customLatitude);
    expect(sanitizeSettings({ customLatitude: 'north' }).customLatitude).toBe(DEFAULT_SETTINGS.customLatitude);
  });
});
