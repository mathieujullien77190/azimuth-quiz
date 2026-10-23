/** L'animal d'une version : emoji(s), NOM COMPLET de l'espece en anglais (kebab-case, ex. "great-tit"), et son article Wikipedia anglais (lien du nom). */
export type Codename = { emoji: string; name: string; wiki: string };

/** La ligne de version en morceaux, pour que le rendu (`VersionLine`) et `versionLabel` ne divergent pas : `prefix` "v2.65.0 - 🐦 - ", `name` "great-tit" ; sans animal, juste "v2.65.0". */
export type VersionParts = { prefix: string; name: string | null; wiki: string | null };

export const versionParts = (version: string, codename: Codename | undefined): VersionParts =>
  codename === undefined
    ? { prefix: `v${version}`, name: null, wiki: null }
    : { prefix: `v${version} - ${codename.emoji} - `, name: codename.name, wiki: codename.wiki };

/** Version affichee (splash, A propos, admin) : "v2.65.0 - 🐦 - great-tit", ou "v2.65.0" sans animal. */
export const versionLabel = (version: string, codename: Codename | undefined): string => {
  const { prefix, name } = versionParts(version, codename);
  return name === null ? prefix : prefix + name;
};
