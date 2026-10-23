export type FooterNavProps = {
  /**
   * Section ou la manche est defilee, controlee par le parent (qui possede `onScroll`) : elle suit aussi le
   * defilement a la main.
   */
  onCap: boolean;
  onGoToCap: () => void;
  onGoToDistance: () => void;
  validateDisabled: boolean;
  onValidate: () => void;
};
