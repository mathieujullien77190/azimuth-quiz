/**
 * Empile monospace. Marche tel quel sur le web (react-native-web passe la chaine a CSS
 * `font-family`) ; sur iOS/Android, RN ignore silencieusement un nom de police introuvable
 * et retombe sur la police systeme (aucune de ces polices n'est embarquee dans l'app).
 */
export const FONT_FAMILY =
  '"JetBrains Mono", ui-monospace, "Cascadia Mono", "Roboto Mono", "Droid Sans Mono", Consolas, monospace';
