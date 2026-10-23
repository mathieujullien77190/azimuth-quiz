import type { ReactNode, Ref } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

export type ScreenProps = {
  children: ReactNode;
  /** Reste fixe en haut, au-dessus de la zone qui defile (ex. selecteur de joueur). */
  header?: ReactNode;
  /**
   * Reste fixe en bas, sous la zone qui defile ; rendu tel quel, a envelopper dans un `GameFooter` pour le
   * look de panneau.
   */
  footer?: ReactNode;
  /** Dessine sur tout l'ecran, header et footer compris, sans jamais capter le toucher (ex. reactions emoji). */
  overlay?: ReactNode;
  /** Optionnel : acces au ScrollView interne (ex. `scrollTo` programmatique). */
  scrollRef?: Ref<ScrollView>;
  /**
   * Optionnel : transmis tel quel au ScrollView interne (ex. suivre la position pour synchroniser le libelle d'un
   * bouton de footer, voir FooterNav de GameScreen/OnlineGameScreen).
   */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};
