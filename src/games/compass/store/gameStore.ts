import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

import { DEFAULT_ORIGIN } from '@/data';
import { DEFAULT_DISTANCE_KM, DEFAULT_SETTINGS } from '@/games/compass/constants';
import { applyBestBonus, pickPlaces, resolveOrigin, scoreRound } from '@/helpers';
import type { Language } from '@/i18n';
import type { GamePhase, GameSettings, Guess, Origin, Place, RoundRecord } from '@/types';

import { rotatedOrder } from '../screens/GameScreen/helpers';

/** Default starting heading: north, needle already visible and movable. */
const DEFAULT_BEARING = 0;

/** A player's draft (needle + distance) before submitting. `*Touched` distinguishes a value
 * genuinely chosen by the player from one left at its default (never touched): "Submit"
 * relies on this to avoid recording a random answer. */
export type Draft = { bearing: number; distanceKm: number; bearingTouched: boolean; distanceTouched: boolean };

/** Starting draft: needle at north, default distance, nothing touched yet. */
export const DEFAULT_DRAFT: Draft = {
  bearing: DEFAULT_BEARING,
  distanceKm: DEFAULT_DISTANCE_KM,
  bearingTouched: false,
  distanceTouched: false,
};

/** Ignores the result of a stale `start()` (unmount, or replaying before loading finished) — a
 * plain module field rather than a `useRef`, since the store itself (not a component) owns
 * `start`'s lifetime. Bumped by `cancelStart`, called from `useGame`'s unmount cleanup. */
let startId = 0;

type RoundState = {
  roundOrder: number[];
  activePlayerIndex: number;
  guessesByPlayer: (Guess | undefined)[];
  draftsByPlayer: Draft[];
};

/** New round: each player starts over with a blank draft, tabs in pure rotation (see
 * `rotatedOrder`) so the first player to answer changes fairly every round. */
const startRound = (playerCount: number, roundIdx: number): RoundState => {
  const order = rotatedOrder(roundIdx, playerCount);
  return {
    roundOrder: order,
    activePlayerIndex: order[0] ?? 0,
    guessesByPlayer: new Array(playerCount).fill(undefined),
    draftsByPlayer: new Array(playerCount).fill(DEFAULT_DRAFT),
  };
};

type GameStoreState = RoundState & {
  phase: GamePhase;
  /** Settings frozen at launch: changing them elsewhere doesn't affect the ongoing game. */
  config: GameSettings;
  origin: Origin;
  places: Place[];
  roundIndex: number;
  records: RoundRecord[];

  /** Updates only the active player's draft, without touching the others. */
  setBearing: (value: number) => void;
  setDistanceKm: (value: number) => void;
  start: (settings: GameSettings, language: Language, deviceOriginName: string) => Promise<void>;
  cancelStart: () => void;
  /** "Submit" button: the only path that reveals the answer, once everyone has answered. */
  submit: () => void;
  next: () => void;
};

export const useGameStore = create<GameStoreState>()((set, get) => ({
  phase: 'loading',
  config: DEFAULT_SETTINGS,
  origin: DEFAULT_ORIGIN,
  places: [],
  roundIndex: 0,
  records: [],
  roundOrder: [],
  activePlayerIndex: 0,
  guessesByPlayer: [],
  draftsByPlayer: [],

  setBearing: (value) =>
    set((state) => ({
      draftsByPlayer: state.draftsByPlayer.map((draft, index) =>
        index === state.activePlayerIndex ? { ...draft, bearing: value, bearingTouched: true } : draft,
      ),
    })),

  setDistanceKm: (value) =>
    set((state) => ({
      draftsByPlayer: state.draftsByPlayer.map((draft, index) =>
        index === state.activePlayerIndex ? { ...draft, distanceKm: value, distanceTouched: true } : draft,
      ),
    })),

  start: async (settings, language, deviceOriginName) => {
    const id = ++startId;
    set({ phase: 'loading' });

    const resolvedOrigin = settings.useGps
      ? await resolveOrigin(deviceOriginName)
      : { ...DEFAULT_ORIGIN, coordinates: { latitude: settings.customLatitude, longitude: settings.customLongitude } };
    if (id !== startId) return;

    set({
      config: settings,
      origin: resolvedOrigin,
      places: pickPlaces(resolvedOrigin.coordinates, settings, language),
      roundIndex: 0,
      records: [],
      phase: 'guess',
      ...startRound(settings.playerNames.length, 0),
    });
  },

  cancelStart: () => {
    startId += 1;
  },

  submit: () => {
    const state = get();
    const place = state.places[state.roundIndex];
    if (place === undefined) return;

    const draft = state.draftsByPlayer[state.activePlayerIndex] ?? DEFAULT_DRAFT;
    const guess: Guess = { bearing: draft.bearing, distanceKm: draft.distanceKm };
    const updated = state.guessesByPlayer.map((existing, index) =>
      index === state.activePlayerIndex ? guess : existing,
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    set({ guessesByPlayer: updated });

    const complete = !state.roundOrder.some((index) => updated[index] === undefined);
    if (!complete) {
      const nextUnanswered = state.roundOrder.find((index) => updated[index] === undefined) as number;
      set({ activePlayerIndex: nextUnanswered });
      return;
    }

    const results = applyBestBonus(
      updated.map((playerGuess) => ({
        guess: playerGuess as Guess,
        score: scoreRound(state.origin.coordinates, place, playerGuess as Guess),
      })),
    );
    set((current) => ({ records: [...current.records, { place, results }], phase: 'reveal' }));
  },

  next: () => {
    const state = get();
    if (state.roundIndex + 1 < state.places.length) {
      const roundIdx = state.roundIndex + 1;
      set({ roundIndex: roundIdx, phase: 'guess', ...startRound(state.config.playerNames.length, roundIdx) });
      return;
    }
    set({ phase: 'end' });
  },
}));
