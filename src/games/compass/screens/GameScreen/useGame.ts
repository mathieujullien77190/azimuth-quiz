import { useEffect, useMemo } from 'react';

import { useLanguage, useTranslation } from '@/i18n';
import { PLAYER_COLORS } from '@/data';
import { MAX_STRAIGHT_DISTANCE_KM, MAX_SURFACE_DISTANCE_KM } from '@/games/compass/constants';
import { playerDisplayName } from '@/helpers';
import { useSettings } from '@/settings';
import type { Guess, Player } from '@/types';

import { DEFAULT_DRAFT, useGameStore } from '../../store/gameStore';
import { playerTotals } from './helpers';

/**
 * Thin React binding over `gameStore` (the actual state machine): resolves settings/language,
 * kicks off `start()` once settings are ready — a fresh mount of `/game` always restarts a brand
 * new game, exactly as before — and derives the view-friendly values (`players`, `answered`,
 * `totals`...) that used to be plain `useMemo`s over local state. The store itself holds only raw
 * state + actions, so it stays testable without React (see `gameStore.test.ts`).
 */
export const useGame = () => {
  const { settings, ready: settingsReady } = useSettings();
  const t = useTranslation();
  const { language } = useLanguage();

  const store = useGameStore();

  useEffect(() => {
    if (settingsReady) useGameStore.getState().start(settings, language, t.common.yourPosition);
    return () => {
      useGameStore.getState().cancelStart();
    };
    // Deliberately only re-runs when `settingsReady` flips: a stable identity for `settings`/
    // `language`/`t` isn't needed since they're only read once here, at the moment settings
    // become ready — same behavior the old ref-forwarding idiom achieved, without the refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsReady]);

  const players: Player[] = useMemo(
    () =>
      store.config.playerNames.map((name, index) => ({
        name: playerDisplayName(name, index),
        color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      })),
    [store.config.playerNames],
  );
  const isMultiplayer = players.length > 1;
  const maxDistanceKm = store.config.straightLine ? MAX_STRAIGHT_DISTANCE_KM : MAX_SURFACE_DISTANCE_KM;
  const currentPlayer = players[store.activePlayerIndex];

  /** The active player's draft: their in-progress answer (submitted or not). */
  const activeDraft = store.draftsByPlayer[store.activePlayerIndex] ?? DEFAULT_DRAFT;

  /** Already-submitted answers of the OTHER players (not the one being edited): to show faded out. */
  const answered = useMemo(
    () =>
      players
        .map((player, index) => ({ player, guess: store.guessesByPlayer[index], index }))
        .filter(
          (entry): entry is { player: Player; guess: Guess; index: number } =>
            entry.index !== store.activePlayerIndex && entry.guess !== undefined,
        ),
    [players, store.guessesByPlayer, store.activePlayerIndex],
  );

  /** One player per index: have they already submitted their answer this round? */
  const answeredByPlayer = useMemo(
    () => store.guessesByPlayer.map((guess) => guess !== undefined),
    [store.guessesByPlayer],
  );

  return {
    phase: store.phase,
    config: store.config,
    players,
    isMultiplayer,
    currentPlayer,
    activePlayerIndex: store.activePlayerIndex,
    roundOrder: store.roundOrder,
    answered,
    answeredByPlayer,
    origin: store.origin,
    place: store.places[store.roundIndex],
    roundNumber: store.roundIndex + 1,
    totalRounds: store.places.length,
    bearing: activeDraft.bearing,
    distanceKm: activeDraft.distanceKm,
    bearingTouched: activeDraft.bearingTouched,
    distanceTouched: activeDraft.distanceTouched,
    maxDistanceKm,
    records: store.records,
    currentRecord: store.records[store.roundIndex],
    totals: playerTotals(store.records, players.length),
    setBearing: store.setBearing,
    setDistanceKm: store.setDistanceKm,
    submit: store.submit,
    next: store.next,
    restart: () => useGameStore.getState().start(settings, language, t.common.yourPosition),
  };
};
