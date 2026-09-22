import type { Player } from '@/types';

export type HandoffScreenProps = {
  player: Player;
  roundNumber: number;
  totalRounds: number;
  onReady: () => void;
  onQuit: () => void;
};
