/** The animal a version is named after: its emoji (two when one is not enough: "🦉❄️" for the snowy owl), its FULL
 * species name in English, always, whatever the language of the app, as a kebab-case slug ("great-tit", not the short
 * "tit"; "brown-throated-sloth"), and the English Wikipedia article of the species ("https://en.wikipedia.org/wiki/Great_tit"),
 * which the name links to wherever the version is shown. */
export type Codename = { emoji: string; name: string; wiki: string };

/** The version line in its pieces, so that what is drawn (`VersionLine`, with the name as a link) and the plain text
 * (`versionLabel`) cannot drift: `prefix` is "v2.65.0 - 🐦 - " and `name` "great-tit" (with its `wiki` link); a version
 * without a codename is just "v2.65.0", no name. */
export type VersionParts = { prefix: string; name: string | null; wiki: string | null };

export const versionParts = (version: string, codename: Codename | undefined): VersionParts =>
  codename === undefined
    ? { prefix: `v${version}`, name: null, wiki: null }
    : { prefix: `v${version} - ${codename.emoji} - `, name: codename.name, wiki: codename.wiki };

/** What the app shows for its version, on the splash screen, in About and in the admin: "v2.65.0 - 🐦 - great-tit"
 * (version, emoji, English name), or just "v2.65.0" for a version without a codename. */
export const versionLabel = (version: string, codename: Codename | undefined): string => {
  const { prefix, name } = versionParts(version, codename);
  return name === null ? prefix : prefix + name;
};
