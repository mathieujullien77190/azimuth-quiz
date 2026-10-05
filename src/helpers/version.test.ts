import { versionLabel, type Codename } from './version';

const owl: Codename = { emoji: '🦉❄️', name: 'snowy-owl' };

describe('versionLabel', () => {
  it('reads "v<version> - <emoji> - <name>": the animal of the version, its emoji then its English name', () => {
    expect(versionLabel('2.64.1', owl)).toBe('v2.64.1 - 🦉❄️ - snowy-owl');
  });

  it('is just the number for a version without a codename', () => {
    expect(versionLabel('2.64.1', undefined)).toBe('v2.64.1');
  });
});
