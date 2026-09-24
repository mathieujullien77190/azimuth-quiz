import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLanguage, useTranslation } from '@/i18n';
import {
  DEFAULT_DISTANCE_KM,
  DEFAULT_ORIGIN,
  DEFAULT_SETTINGS,
  MAX_STRAIGHT_DISTANCE_KM,
  MAX_SURFACE_DISTANCE_KM,
  PLAYER_COLORS,
} from '@/constants';
import {
  applyBestBonus,
  inclinationFromChordKm,
  pickPlaces,
  playerDisplayName,
  resolveOrigin,
  scoreRound,
} from '@/helpers';
import { useSettings } from '@/settings';
import type { GamePhase, GameSettings, Guess, Origin, Place, Player, RoundRecord } from '@/types';

import { playerTotals, rotatedOrder } from './helpers';

/** Default starting heading: north, needle already visible and movable. */
const DEFAULT_BEARING = 0;

/** A player's draft (needle + distance) before submitting. `*Touched` distinguishes a value
 * genuinely chosen by the player from one left at its default (never touched): "Submit"
 * relies on this to avoid recording a random answer. */
type Draft = { bearing: number; distanceKm: number; bearingTouched: boolean; distanceTouched: boolean };

/** Starting draft: needle at north, default distance, nothing touched yet. */
const DEFAULT_DRAFT: Draft = {
  bearing: DEFAULT_BEARING,
  distanceKm: DEFAULT_DISTANCE_KM,
  bearingTouched: false,
  distanceTouched: false,
};

export const useGame = () => {
  const { settings, ready: settingsReady } = useSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const t = useTranslation();
  const { language } = useLanguage();
  const languageRef = useRef(language);
  languageRef.current = language;
  const deviceOriginNameRef = useRef(t.common.yourPosition);
  useEffect(() => {
    deviceOriginNameRef.current = t.common.yourPosition;
  }, [t.common.yourPosition]);

  // Settings frozen at launch: changing them elsewhere doesn't affect the ongoing game.
  const [config, setConfig] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [origin, setOrigin] = useState<Origin>(DEFAULT_ORIGIN);
  const [places, setPlaces] = useState<Place[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  // Tab display order: by cumulative score before this round, highest first
  // (purely visual: any tab can be picked in any order).
  const [roundOrder, setRoundOrder] = useState<number[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [guessesByPlayer, setGuessesByPlayer] = useState<(Guess | undefined)[]>([]);
  const [records, setRecords] = useState<RoundRecord[]>([]);
  // Draft (needle + distance, distance slider: surface in classic mode, chord in
  // straightLine mode) for EVERY player, including unsubmitted: switching tabs via PlayerTabs must
  // never lose an in-progress answer, even before clicking "Submit".
  const [draftsByPlayer, setDraftsByPlayer] = useState<Draft[]>([]);

  // Ignores the result of a stale start (unmount, or replaying before loading finished).
  const startId = useRef(0);

  const players: Player[] = useMemo(
    () =>
      config.playerNames.map((name, index) => ({
        name: playerDisplayName(name, index),
        color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      })),
    [config.playerNames],
  );
  const isMultiplayer = players.length > 1;
  const maxDistanceKm = config.straightLine ? MAX_STRAIGHT_DISTANCE_KM : MAX_SURFACE_DISTANCE_KM;

  /** The active player's draft: their in-progress answer (submitted or not). */
  const activeDraft = draftsByPlayer[activePlayerIndex] ?? DEFAULT_DRAFT;
  const bearing = activeDraft.bearing;
  const distanceKm = activeDraft.distanceKm;
  const bearingTouched = activeDraft.bearingTouched;
  const distanceTouched = activeDraft.distanceTouched;

  /** Updates only the active player's draft, without touching the others. */
  const setBearing = useCallback(
    (value: number) => {
      setDraftsByPlayer((previous) =>
        previous.map((draft, index) =>
          index === activePlayerIndex ? { ...draft, bearing: value, bearingTouched: true } : draft,
        ),
      );
    },
    [activePlayerIndex],
  );

  const setDistanceKm = useCallback(
    (value: number) => {
      setDraftsByPlayer((previous) =>
        previous.map((draft, index) =>
          index === activePlayerIndex ? { ...draft, distanceKm: value, distanceTouched: true } : draft,
        ),
      );
    },
    [activePlayerIndex],
  );

  /**
   * New round: each player starts over with a blank draft, tabs in pure rotation
   * (see `rotatedOrder`) so the first player to answer changes fairly every round.
   */
  const startRound = useCallback((playerCount: number, roundIdx: number) => {
    const order = rotatedOrder(roundIdx, playerCount);
    setRoundOrder(order);
    setActivePlayerIndex(order[0] ?? 0);
    setGuessesByPlayer(new Array(playerCount).fill(undefined));
    setDraftsByPlayer(new Array(playerCount).fill(DEFAULT_DRAFT));
  }, []);

  const start = useCallback(async () => {
    const id = ++startId.current;
    const chosen = settingsRef.current;
    setPhase('loading');

    const resolvedOrigin = chosen.useGps
      ? await resolveOrigin(deviceOriginNameRef.current)
      : { ...DEFAULT_ORIGIN, coordinates: { latitude: chosen.customLatitude, longitude: chosen.customLongitude } };
    if (id !== startId.current) return;

    setConfig(chosen);
    setOrigin(resolvedOrigin);
    setPlaces(pickPlaces(resolvedOrigin.coordinates, chosen, languageRef.current));
    setRoundIndex(0);
    setRecords([]);
    startRound(chosen.playerNames.length, 0);
    setPhase('guess');
  }, [startRound]);

  // Waits for the saved settings to be read (direct reload on the game screen).
  useEffect(() => {
    if (settingsReady) start();
    return () => {
      startId.current += 1;
    };
  }, [settingsReady, start]);

  const currentPlayer = players[activePlayerIndex];

  /** Already-submitted answers of the OTHER players (not the one being edited): to show faded out. */
  const answered = useMemo(
    () =>
      players
        .map((player, index) => ({ player, guess: guessesByPlayer[index], index }))
        .filter(
          (entry): entry is { player: Player; guess: Guess; index: number } =>
            entry.index !== activePlayerIndex && entry.guess !== undefined,
        ),
    [players, guessesByPlayer, activePlayerIndex],
  );

  /** One player per index: have they already submitted their answer this round? */
  const answeredByPlayer = useMemo(() => guessesByPlayer.map((guess) => guess !== undefined), [guessesByPlayer]);

  /**
   * Records the active player's answer from their current draft. Returns the up-to-date
   * answers array and whether everyone has now answered — NEVER triggers the reveal
   * itself: that stays the sole job of "Submit" (see `submit`), so switching to another
   * tab (even if it was the last missing answer) never shows the reveal by itself.
   */
  const commitActiveGuess = useCallback((): { updated: (Guess | undefined)[]; complete: boolean } => {
    const place = places[roundIndex];
    if (place === undefined) return { updated: guessesByPlayer, complete: false };

    const guess: Guess = {
      bearing,
      distanceKm,
      inclination: config.straightLine ? inclinationFromChordKm(distanceKm) : 0,
    };
    const updated = guessesByPlayer.map((existing, index) => (index === activePlayerIndex ? guess : existing));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setGuessesByPlayer(updated);

    return { updated, complete: !roundOrder.some((index) => updated[index] === undefined) };
  }, [activePlayerIndex, bearing, config, distanceKm, guessesByPlayer, places, roundIndex, roundOrder]);

  /** Computes the scores and switches to the reveal phase. */
  const reveal = useCallback(
    (updated: (Guess | undefined)[]) => {
      // Only ever called from `submit` right after `commitActiveGuess` confirmed `complete`,
      // which itself requires `places[roundIndex]` to already be defined — so this is never `undefined`.
      const place = places[roundIndex];

      const results = applyBestBonus(
        players.map((_, index) => {
          const playerGuess = updated[index] as Guess;
          return { guess: playerGuess, score: scoreRound(origin.coordinates, place, playerGuess, config) };
        }),
      );
      setRecords((previous) => [...previous, { place, results }]);
      setPhase('reveal');
    },
    [config, origin, places, players, roundIndex],
  );

  /**
   * Switches tabs. Clicking directly on another player first submits the in-progress answer
   * (like "Submit"), then switches to the chosen player — even if that submission just
   * answered the last missing player, the reveal doesn't appear: you have to press
   * "Submit" to get it.
   */
  const selectPlayer = useCallback(
    (index: number) => {
      if (index === activePlayerIndex) return;
      const locked = guessesByPlayer[index] !== undefined && !config.allowRevision;
      if (locked) return;

      commitActiveGuess();
      setActivePlayerIndex(index);
    },
    [activePlayerIndex, commitActiveGuess, config.allowRevision, guessesByPlayer],
  );

  /** "Submit" button: the only path that reveals the answer, once everyone has answered. */
  const submit = useCallback(() => {
    const { updated, complete } = commitActiveGuess();
    if (complete) {
      reveal(updated);
      return;
    }

    // `complete` is false, so at least one player in `roundOrder` still has no guess in `updated`.
    const nextUnanswered = roundOrder.find((index) => updated[index] === undefined) as number;
    setActivePlayerIndex(nextUnanswered);
  }, [commitActiveGuess, reveal, roundOrder]);

  const next = useCallback(() => {
    if (roundIndex + 1 < places.length) {
      setRoundIndex(roundIndex + 1);
      startRound(players.length, roundIndex + 1);
      setPhase('guess');
      return;
    }

    setPhase('end');
  }, [places.length, players.length, roundIndex, startRound]);

  return {
    phase,
    config,
    players,
    isMultiplayer,
    currentPlayer,
    activePlayerIndex,
    roundOrder,
    answered,
    answeredByPlayer,
    origin,
    place: places[roundIndex],
    roundNumber: roundIndex + 1,
    totalRounds: places.length,
    bearing,
    distanceKm,
    bearingTouched,
    distanceTouched,
    maxDistanceKm,
    records,
    currentRecord: records[roundIndex],
    totals: playerTotals(records, players.length),
    setBearing,
    setDistanceKm,
    selectPlayer,
    submit,
    next,
    restart: start,
  };
};
