import type { ContourHintCategory } from '@/types';

export type HintCategorySectionProps = {
  /** Which kinds of hints are in play (at least one: the caller refuses to remove the last). */
  selected: ContourHintCategory[];
  onToggle: (id: ContourHintCategory) => void;
  /** Read-only for a joiner: the host decides. */
  disabled?: boolean;
};
