import { Platform } from 'react-native';

const STYLE_ID = 'fullazimut-no-select';

/**
 * Sur le web, glisser le doigt / la souris sur la boussole ou les curseurs selectionne le texte.
 * On coupe la selection partout, sauf dans les champs de saisie (noms des joueurs).
 * Sans effet sur mobile.
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
