export type FooterNavProps = {
  /** Which section the round is scrolled to right now — controlled by the parent (which owns
   * the `ScrollView`'s `onScroll`, see GameScreen/OnlineGameScreen), not local state: it must
   * also flip when the player drags the scroll by hand, not just on a button press. */
  onCap: boolean;
  onGoToCap: () => void;
  onGoToDistance: () => void;
  validateDisabled: boolean;
  onValidate: () => void;
};
