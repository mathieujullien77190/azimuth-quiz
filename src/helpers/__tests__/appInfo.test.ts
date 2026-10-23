import appConfig from '../../../app.json';

import { APP_CODENAME, APP_VERSION_NUMBER, versionLabel, versionParts, type Codename } from '../appInfo';

describe('appInfo', () => {
  it('reads the version and its animal from app.json itself', () => {
    expect(APP_VERSION_NUMBER).toBe(appConfig.expo.version);
    expect(APP_CODENAME).toEqual(appConfig.expo.extra.codename);
  });

  it('links the animal to its English Wikipedia article', () => {
    expect(APP_CODENAME?.wiki).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\/\S+$/);
  });

  it('always has an animal, so the label is more than the number', () => {
    expect(versionLabel(APP_VERSION_NUMBER, APP_CODENAME)).toMatch(/^v\d+\.\d+\.\d+ - \S+ - [a-z-]+$/);
  });
});

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
