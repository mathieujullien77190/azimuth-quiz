import type { HintGroup, HintGroupView } from '@/games/contour/helpers/hintPlan';

export type ContourHintListProps = {
  /** The groups of the round (`hintGroupsView`): the outline, the neighbors, the cities, then the country itself. */
  groups: HintGroupView[];
  /** Not this device's turn: the list is dimmed, a tap is still reported (the caller explains why nothing happens). */
  disabled?: boolean;
  /** The turn-holder tapped the next step of `group`. */
  onPick: (group: HintGroup) => void;
};
