import type { RefObject } from 'react';
import type { ScrollView } from 'react-native';

import type { LegendItem } from '../../components/Legend';
import type { EarthMark } from '@/common/EarthSection';
import type { GameSettings, Place, Player, RoundRecord } from '@/types';

export type GameScreenProps = {
  onQuit: () => void;
};

/** A needle drawn on `Compass` besides the active/current one — same shape `Compass` itself
 * expects for `extraNeedles`. */
export type Needle = { bearing: number; color: string };

/**
 * Pure rendering, no hooks with side effects — `GameScreen` (smart) resolves `useGame()` and
 * every derived array/label before this component ever sees them.
 */
export type GameScreenViewProps = {
  scrollRef: RefObject<ScrollView | null>;
  onQuit: () => void;
  scoreLabel: string;
  config: GameSettings;
  roundNumber: number;
  totalRounds: number;
  isMultiplayer: boolean;
  record: RoundRecord | undefined;
  activePlayerIndex: number;
  answeredByPlayer: boolean[];
  roundOrder: number[];
  players: Player[];
  currentPlayerName: string;
  place: Place;
  playerColor: string;
  bearing: number;
  onSetBearing: (value: number) => void;
  answeredNeedles: Needle[];
  revealNeedles: Needle[];
  legendItems: LegendItem[];
  earthMarks: EarthMark[];
  distanceKm: number;
  onSetDistanceKm: (value: number) => void;
  maxDistanceKm: number;
  totals: number[];
  isLastRound: boolean;
  onNext: () => void;
  onGoToCap: () => void;
  onGoToDistance: () => void;
  onSubmit: () => void;
  validateDisabled: boolean;
};
