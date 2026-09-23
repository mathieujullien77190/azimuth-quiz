import type { ReactNode, Ref } from 'react';
import type { ScrollView } from 'react-native';

export type ScreenProps = {
  children: ReactNode;
  /** Reste fixe en haut, au-dessus de la zone qui defile (ex. selecteur de joueur). */
  header?: ReactNode;
  /** Reste fixe en bas, sous la zone qui defile (ex. bouton d'action principal). */
  footer?: ReactNode;
  /** Optionnel : donne acces au ScrollView interne (ex. scrollTo programmatique). */
  scrollRef?: Ref<ScrollView>;
};
