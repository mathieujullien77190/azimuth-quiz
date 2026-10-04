import type { RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

import type { EarthMark } from '@/components/EarthSection';
import type { ReactionOverlayProps } from '@/components/ReactionOverlay';
import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { Coordinates, Difficulty, Place, RoundRecord } from '@/types';

export type OnlineGameScreenProps = {
  code: string;
  onQuit: () => void;
};

/** A needle drawn on `Compass` besides the active/current one. */
export type Needle = { bearing: number; color: string };

/** Header shared by both phases: quit + name/score + round progress. Pure rendering. */
export type OnlineHeaderProps = {
  onQuit: () => void;
  /** This device's player and running total, for the header. */
  name: string;
  points: number;
  roomCode: string;
  difficulty: Difficulty;
  roundNumber: number;
  totalRounds: number;
};

/**
 * Single view for both phases (answer / submitted-or-revealed) sharing one `Screen`/`ScrollView`
 * instance — kept mounted across the submit so the scroll position survives it, instead of
 * unmounting into a separate `Screen` (which used to reset the native scroll to the top). `record`
 * is the discriminant, same convention as the local `GameScreen`'s own view: `undefined` while
 * still answering, always set (pending or confirmed) once submitted — see `OnlineGameScreen`'s
 * `record: confirmedRecord ?? buildRoundRecord(...)`.
 */
export type OnlineGameScreenViewProps = OnlineHeaderProps & {
  scrollRef: RefObject<ScrollView | null>;
  place: Place;
  liveCompass: boolean;
  earthMarks: EarthMark[];
  /** The round's starting point: at the reveal, lets the Earth view switch to the flat world map (see `EarthSection`). */
  origin: Coordinates;
  /** Travel mode, rounds after the first: where the player stands ("Vous êtes à Cusco"), shown in the header. */
  location?: string;
  // Answer phase only (ignored once `record` is set).
  showCountry: boolean;
  compassColor: string;
  bearing: number;
  onSetBearing: (value: number) => void;
  distanceKm: number;
  onSetDistanceKm: (value: number) => void;
  maxDistanceKm: number;
  /** See `FooterNav`'s own comment: which section the round is scrolled to right now. */
  onCap: boolean;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onGoToCap: () => void;
  onGoToDistance: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  // Submitted-or-revealed phase only (present once `record` is set).
  extraNeedles?: Needle[];
  truthBearing?: number | null;
  answered?: boolean[];
  localIndex?: number;
  onKick?: (index: number) => void;
  players?: OnlinePlayer[];
  record?: RoundRecord;
  totals?: number[];
  confirmed?: boolean;
  isHost?: boolean;
  isLastRound?: boolean;
  onNextRound?: () => void;
  /** The emoji reaction on screen right now, and what a tap on the footer's emojis calls (undefined alone in the room). */
  reaction?: ReactionOverlayProps['reaction'];
  onReact?: (emoji: string) => void;
};
