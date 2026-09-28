import type { ReactNode } from 'react';

import type { SetupPartyProps } from '@/components/setup/useSetupRoom';

export type SetupScreenShellProps = {
  title: string;
  /** The game's emoji, beside the title. */
  icon: string;
  /** Solo / host / join block, already resolved by `useSetupRoom`. */
  party: SetupPartyProps;
  overlayMessage: string | null;
  /** A spinner above the notice: the game is being started, the setup stays visible behind it. */
  overlayLoading?: boolean;
  onDismissOverlay: () => void;
  /** The game's own sections (categories, difficulty, rounds, options...), rendered between the
   * party block and the buttons. */
  children: ReactNode;
  startLabel: string;
  backLabel: string;
  startDisabled: boolean;
  onStartPress: () => void;
  onBack: () => void;
};
