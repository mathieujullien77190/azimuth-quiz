import type { Player, RoundRecord } from '@/types';

export type RoundResultProps = {
  record: RoundRecord;
  players: Player[];
  isLastRound: boolean;
  onNext: () => void;
};
