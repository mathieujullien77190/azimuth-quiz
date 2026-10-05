import appConfig from '../../app.json';

import { APP_CODENAME, APP_VERSION_NUMBER } from './appInfo';
import { versionLabel } from './version';

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
