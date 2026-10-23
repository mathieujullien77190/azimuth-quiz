import type { RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

import type { EarthMark } from '@/components/geo/EarthSection';
import type { ReactionOverlayProps } from '@/components/game/ReactionOverlay';
import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { Coordinates, Difficulty, Place, RoundRecord } from '@/types';

export type OnlineGameScreenProps = {
  code: string;
  onQuit: () => void;
};

/** Aiguille dessinee sur `Compass` en plus de l'active. */
export type Needle = { bearing: number; color: string };

/** En-tete commun aux deux phases : quitter, nom/score, progression. Rendu pur. */
export type OnlineHeaderProps = {
  onQuit: () => void;
  /** Joueur de cet appareil et son total. */
  name: string;
  points: number;
  roomCode: string;
  difficulty: Difficulty;
  roundNumber: number;
  totalRounds: number;
};

/**
 * Vue unique pour les deux phases (reponse / envoye-reveal) : un seul `Screen`/`ScrollView` reste monte a
 * l'envoi pour garder le defilement. `record` discrimine : `undefined` pendant la reponse, defini (pending
 * ou confirme) ensuite.
 */
export type OnlineGameScreenViewProps = OnlineHeaderProps & {
  scrollRef: RefObject<ScrollView | null>;
  place: Place;
  earthMarks: EarthMark[];
  /**
   * Point de depart de la manche : au reveal, permet de passer la Terre a la carte plate (voir
   * `EarthSection`).
   */
  origin: Coordinates;
  /**
   * Mode voyage, apres la 1re manche : ou se trouve le joueur ("Vous etes a Cusco"), affiche dans le
   * header.
   */
  location?: string;
  // Phase reponse seulement (ignore des que `record` est defini).
  showCountry: boolean;
  compassColor: string;
  bearing: number;
  onSetBearing: (value: number) => void;
  distanceKm: number;
  onSetDistanceKm: (value: number) => void;
  maxDistanceKm: number;
  /** Voir le commentaire de `FooterNav`. */
  onCap: boolean;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onGoToCap: () => void;
  onGoToDistance: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  // Phase envoye/reveal seulement (present des que `record` est defini).
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
  /**
   * Reaction emoji a l'ecran, et ce que le tap sur les emojis du pied appelle (undefined seul dans la
   * room).
   */
  reaction?: ReactionOverlayProps['reaction'];
  onReact?: (emoji: string) => void;
};
