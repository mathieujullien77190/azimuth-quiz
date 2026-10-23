/**
 * `base` : croix dans un cercle, couleur de texte normale (headers de jeu). `accent` : croix simple, sans
 * cercle, couleur d'accent (ecrans de setup).
 */
export type QuitButtonVariant = 'base' | 'accent';

export type QuitButtonProps = {
  onPress: () => void;
  variant?: QuitButtonVariant;
};
