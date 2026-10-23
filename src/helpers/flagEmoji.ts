/** Emoji drapeau d'un code ISO 3166-1 alpha-2 ("FR" -> 🇫🇷). Exige `FLAG_FONT_FAMILY` (themes/fonts.ts)
 * a l'affichage : Chromium sous Windows n'a pas de police systeme pour les drapeaux. */
export const flagEmoji = (code: string): string =>
  code
    .toUpperCase()
    .split('')
    .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
    .join('');
