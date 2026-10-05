import { versionParts } from '@/helpers/version';

import appConfig from '../../../../app.json';

/** The version of the app in the admin's header, "v2.65.0 - 🐦 - great-tit", the animal's name being a link to its English
 * Wikipedia article (the same pieces as the game's own version line, see `versionParts`). */
export const AppVersion = () => {
  const { prefix, name, wiki } = versionParts(appConfig.expo.version, appConfig.expo.extra.codename);
  return (
    <>
      {prefix}
      {name !== null && wiki !== null && (
        <a className="version-link" href={wiki} target="_blank" rel="noopener noreferrer">
          {name}
        </a>
      )}
    </>
  );
};
