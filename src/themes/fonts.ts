/**
 * Pile monospace. Telle quelle sur le web ; sur iOS/Android, RN ignore une police inconnue et retombe sur celle du systeme (aucune n'est embarquee).
 */
export const FONT_FAMILY =
  '"JetBrains Mono", ui-monospace, "Cascadia Mono", "Roboto Mono", "Droid Sans Mono", Consolas, monospace';

/**
 * Prefixe de tout Text affichant un vrai emoji drapeau (`flagEmoji`). "Twemoji Country Flags" est injectee sur le web seulement si besoin
 * (`polyfillCountryFlagEmojis()`) : Chromium sous Windows n'a pas de police de drapeaux et affiche le code. Sans effet en natif.
 */
export const FLAG_FONT_FAMILY = '"Twemoji Country Flags", sans-serif';
