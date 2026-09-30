/** The actual flag emoji for an ISO 3166-1 alpha-2 code (e.g. "FR" -> 🇫🇷): built from the two
 * regional indicator symbols, not stored data — works for any valid code. Relies on
 * `FLAG_FONT_FAMILY` (see themes/fonts.ts) being applied wherever this is rendered, since some
 * platforms (Chromium on Windows) don't ship a system font that renders these as flags. */
export const flagEmoji = (code: string): string =>
  code
    .toUpperCase()
    .split('')
    .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
    .join('');
