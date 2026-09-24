import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { Platform } from 'react-native';

const STYLE_ID = 'azimuthquiz-no-select';

/**
 * On the web, dragging a finger/mouse across the compass or the sliders selects text.
 * Selection is disabled everywhere except input fields (player names). No effect on mobile.
 */
export const disableTextSelection = (): void => {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById(STYLE_ID) !== null) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
    input, textarea { -webkit-user-select: text; user-select: text; }
  `;
  document.head.appendChild(style);
};

/**
 * Chromium on Windows has no system font that renders flag emoji as flags — it shows the raw
 * two-letter country code instead. `country-flag-emoji-polyfill` injects a small (78kb) webfont
 * ("Twemoji Country Flags", see `FLAG_FONT_FAMILY` in themes/fonts.ts) covering just those
 * codepoints, and only when the browser actually needs it — a no-op everywhere else, including
 * native iOS/Android, which already render flag emoji correctly.
 */
export const polyfillFlagEmoji = (): void => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  polyfillCountryFlagEmojis();
};
