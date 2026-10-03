import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { Platform, type ViewStyle } from 'react-native';

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

/**
 * A view that takes the touch for itself on the web: the page neither scrolls nor zooms under a finger that is dragging
 * what is inside it — the 3D globe one turns, for instance. `touchAction` is a CSS property react-native-web passes
 * through, hence the cast; on a phone there is no page to scroll, and react-native would warn about the unknown style.
 */
export const noPageScroll = (): ViewStyle | undefined =>
  Platform.OS === 'web' ? ({ touchAction: 'none' } as unknown as ViewStyle) : undefined;
