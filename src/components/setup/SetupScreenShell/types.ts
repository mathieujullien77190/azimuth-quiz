import type { ReactNode } from 'react';

import type { SetupPartyProps } from '@/components/setup/useSetupRoom';

export type SetupScreenShellProps = {
  title: string;
  /** Emoji du jeu, a cote du titre. */
  icon: string;
  /** Bloc solo / hote / rejoindre, deja resolu par `useSetupRoom`. */
  party: SetupPartyProps;
  overlayMessage: string | null;
  /** Spinner au-dessus de la notice : la partie demarre, le setup reste visible derriere. */
  overlayLoading?: boolean;
  onDismissOverlay: () => void;
  /** Sections propres au jeu (categories, difficulte, manches, options...), entre le bloc partie et les boutons. */
  children: ReactNode;
  startLabel: string;
  backLabel: string;
  startDisabled: boolean;
  onStartPress: () => void;
  onBack: () => void;
};
