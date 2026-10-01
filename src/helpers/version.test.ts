import { versionLabel } from './version';

describe('versionLabel', () => {
  it('adds the animal of the version, its emoji then its name', () => {
    expect(versionLabel('2.55.3', { emoji: '🦉❄️', name: 'snowyOwl' })).toBe('v2.55.3 🦉❄️ snowyOwl');
  });

  it('is just the number for a version without a codename', () => {
    expect(versionLabel('2.55.3')).toBe('v2.55.3');
  });
});
