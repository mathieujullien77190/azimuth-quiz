/** The animal a version is named after: its emoji (two when one is not enough: "🦉❄️" for the snowy owl) and its FULL
 * species name in English, always, whatever the language of the app, as a kebab-case slug ("great-tit", not the short
 * "tit"; "brown-throated-sloth"). */
export type Codename = { emoji: string; name: string };

/** What the app shows for its version, on the splash screen, in About and in the admin: "v2.64.1 - 🦥 - brown-throated-sloth"
 * (version, emoji, English name), or just "v2.64.1" for a version without a codename. */
export const versionLabel = (version: string, codename: Codename | undefined): string =>
  codename === undefined ? `v${version}` : `v${version} - ${codename.emoji} - ${codename.name}`;
