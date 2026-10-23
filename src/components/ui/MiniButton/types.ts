import type { StyleProp, ViewStyle } from 'react-native';

/** Couleur de la bordure et du libelle : l'accent de l'app, ou le rouge danger (expulser, supprimer...). */
export type MiniButtonVariant = 'accent' | 'danger';

export type MiniButtonProps = {
  label: string;
  onPress: () => void;
  variant?: MiniButtonVariant;
  /** Lu a la place de `label` quand le libelle seul est ambigu (« Expulser » -> « Retirer Anna »). */
  accessibilityLabel?: string;
  /** Pour l'espacement de l'appelant (`marginTop`...) : le bouton n'en porte aucun. */
  style?: StyleProp<ViewStyle>;
};
