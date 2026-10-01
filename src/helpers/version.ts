/** The animal a version is named after: its emoji (two when one is not enough: "🦉❄️" for the snowy owl) and its English
 * name in camelCase, no space ("snowyOwl"). */
export type Codename = { emoji: string; name: string };

/** What the app shows for its version: "v2.55.3 🦉❄️ snowyOwl", or just "v2.55.3" for a version without a codename. */
export const versionLabel = (version: string, codename?: Codename): string =>
  codename === undefined ? `v${version}` : `v${version} ${codename.emoji} ${codename.name}`;
