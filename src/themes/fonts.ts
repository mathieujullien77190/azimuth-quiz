/**
 * Monospace stack. Works as-is on web (react-native-web passes the string straight to CSS
 * `font-family`); on iOS/Android, RN silently ignores an unknown font name and falls back to
 * the system font (none of these fonts are bundled with the app).
 */
export const FONT_FAMILY =
  '"JetBrains Mono", ui-monospace, "Cascadia Mono", "Roboto Mono", "Droid Sans Mono", Consolas, monospace';

/**
 * Prefix for any Text rendering an actual flag emoji (see `flagEmoji` in
 * constants/places/countries.ts). "Twemoji Country Flags" is injected on web, only when needed,
 * by `polyfillCountryFlagEmojis()` (see app/_layout.tsx) — it fixes Chromium-on-Windows, which
 * has no system font for flag emoji and renders the two-letter code instead. Native iOS/Android
 * already render flag emoji correctly, so this is a no-op there either way.
 */
export const FLAG_FONT_FAMILY = '"Twemoji Country Flags", sans-serif';
