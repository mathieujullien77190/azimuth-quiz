import { versionParts } from '@/helpers/version';

import appConfig from '../../../../app.json';

/**
 * Version de l'app dans l'en-tete de l'admin ; le nom de l'animal est un lien vers son article Wikipedia anglais
 * (memes morceaux que `versionParts`).
 */
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
