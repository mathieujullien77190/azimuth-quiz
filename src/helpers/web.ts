import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import { Platform, type ViewStyle } from 'react-native';

const STYLE_ID = 'azimuthquiz-no-select';

/** Sur le web, glisser sur la boussole ou les curseurs selectionne du texte : desactive sauf dans les champs. Sans effet sur mobile. */
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
 * Chromium sous Windows n'a pas de police pour les drapeaux emoji (il affiche le code a 2 lettres) : le polyfill
 * injecte une petite webfont ("Twemoji Country Flags", `FLAG_FONT_FAMILY`) seulement si besoin.
 */
export const polyfillFlagEmoji = (): void => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  polyfillCountryFlagEmojis();
};

/**
 * Vue qui garde le toucher sur le web (la page ne defile ni ne zoome sous le doigt, ex. le globe 3D). `touchAction`
 * est du CSS passe par react-native-web, d'ou le cast ; sur mobile react-native avertirait du style inconnu.
 */
export const noPageScroll = (): ViewStyle | undefined =>
  Platform.OS === 'web' ? ({ touchAction: 'none' } as unknown as ViewStyle) : undefined;
