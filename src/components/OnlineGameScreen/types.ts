import type { EarthMark } from '../EarthSection';
import type { Difficulty, Place, RoundRecord } from '@/types';

export type OnlineGameScreenProps = {
  code: string;
  onQuit: () => void;
};

/** One connected player, in the stable arrival-order used everywhere in this screen (scores,
 * results, needles) — built once from the room's `players` map (see `onlinePlayersFrom`). */
export type OnlinePlayer = {
  uid: string;
  name: string;
  color: string;
};

/** A needle drawn on `Compass` besides the active/current one. */
export type Needle = { bearing: number; color: string };

/** Header shared by both phases: quit + name/score + round progress. Pure rendering. */
export type OnlineHeaderProps = {
  onQuit: () => void;
  headerScore: string;
  difficulties: Difficulty[];
  roundNumber: number;
  totalRounds: number;
};

/** `gameState.screen === 'game'`, not yet submitted — the only phase with an editable
 * compass/slider. Pure rendering, no hooks with side effects. */
export type OnlineAnswerViewProps = OnlineHeaderProps & {
  place: Place;
  showCountry: boolean;
  compassColor: string;
  liveCompass: boolean;
  bearing: number;
  onSetBearing: (value: number) => void;
  earthMarks: EarthMark[];
  straightLine: boolean;
  distanceKm: number;
  onSetDistanceKm: (value: number) => void;
  maxDistanceKm: number;
  onSubmit: () => void;
  submitDisabled: boolean;
};

/** Submitted-and-waiting or officially revealed — same layout either way (see `RoundResult`'s own
 * `pending` mode), just fed live/partial data until `confirmed`. Pure rendering. */
export type OnlineResultsViewProps = OnlineHeaderProps & {
  place: Place;
  compassColor: string;
  extraNeedles: Needle[];
  liveCompass: boolean;
  truthBearing: number | null;
  earthMarks: EarthMark[];
  straightLine: boolean;
  answered?: boolean[];
  localIndex: number;
  onKick?: (index: number) => void;
  players: OnlinePlayer[];
  record: RoundRecord;
  totals: number[];
  confirmed: boolean;
  isHost: boolean;
  isLastRound: boolean;
  onNextRound: () => void;
};
