import { versionLabel, versionParts, type Codename } from './version';

const owl: Codename = { emoji: '🦉❄️', name: 'snowy-owl', wiki: 'https://en.wikipedia.org/wiki/Snowy_owl' };

describe('versionLabel', () => {
  it('reads "v<version> - <emoji> - <name>": the animal of the version, its emoji then its English name', () => {
    expect(versionLabel('2.64.1', owl)).toBe('v2.64.1 - 🦉❄️ - snowy-owl');
  });

  it('is just the number for a version without a codename', () => {
    expect(versionLabel('2.64.1', undefined)).toBe('v2.64.1');
  });
});

describe('versionParts', () => {
  it('cuts the line into its prefix and the animal name with its Wikipedia link', () => {
    expect(versionParts('2.64.1', owl)).toEqual({
      prefix: 'v2.64.1 - 🦉❄️ - ',
      name: 'snowy-owl',
      wiki: 'https://en.wikipedia.org/wiki/Snowy_owl',
    });
  });

  it('has no name and no link for a version without a codename', () => {
    expect(versionParts('2.64.1', undefined)).toEqual({ prefix: 'v2.64.1', name: null, wiki: null });
  });
});
