import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_DISTANCE_KM,
  DEFAULT_ORIGIN,
  DEFAULT_SETTINGS,
  MAX_STRAIGHT_DISTANCE_KM,
  MAX_SURFACE_DISTANCE_KM,
  PLAYER_COLORS,
} from '@/constants';
import { loadBestScore, pickPlaces, playerDisplayName, resolveOrigin, saveBestScore, scoreRound, shuffle } from '@/helpers';
import { useSettings } from '@/settings';
import type { DistanceMode, GamePhase, GameSettings, Guess, Origin, Place, Player, RoundRecord } from '@/types';

import { playerTotals } from './helpers';

/** Cap de depart par defaut : le nord, aiguille deja visible et deplacable. */
const DEFAULT_BEARING = 0;

export const useGame = () => {
  const { settings, ready: settingsReady } = useSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Reglages figes au lancement : les modifier ailleurs ne change pas la partie en cours.
  const [config, setConfig] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [origin, setOrigin] = useState<Origin>(DEFAULT_ORIGIN);
  const [places, setPlaces] = useState<Place[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  // Ordre de passage de la manche (indices des joueurs), tire au sort a chaque nouveau lieu.
  const [roundOrder, setRoundOrder] = useState<number[]>([]);
  const [turnPosition, setTurnPosition] = useState(0);
  const [guessesByPlayer, setGuessesByPlayer] = useState<(Guess | undefined)[]>([]);
  const [records, setRecords] = useState<RoundRecord[]>([]);
  const [bearing, setBearing] = useState(DEFAULT_BEARING);
  // Les deux curseurs gardent chacun leur valeur ; distanceMode dit lequel des deux compte.
  const [surfaceKm, setSurfaceKm] = useState(DEFAULT_DISTANCE_KM);
  const [straightKm, setStraightKm] = useState(DEFAULT_DISTANCE_KM);
  const [distanceMode, setDistanceMode] = useState<DistanceMode>('surface');
  const [bestScore, setBestScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // Ignore le resultat d'un demarrage obsolete (demontage, ou rejouer avant la fin du chargement).
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

  // A chaque tour (nouveau joueur ou nouvelle manche) : aiguille au nord, curseurs a leur valeur de depart.
  const resetDraft = useCallback(() => {
    setBearing(DEFAULT_BEARING);
    setSurfaceKm(DEFAULT_DISTANCE_KM);
    setStraightKm(DEFAULT_DISTANCE_KM);
    setDistanceMode('surface');
  }, []);

  const startRound = useCallback((playerCount: number) => {
    setRoundOrder(shuffle(Array.from({ length: playerCount }, (_, index) => index)));
    setTurnPosition(0);
    setGuessesByPlayer(new Array(playerCount).fill(undefined));
  }, []);

  const start = useCallback(async () => {
    const id = ++startId.current;
    const chosen = settingsRef.current;
    setPhase('loading');

    const [resolvedOrigin, storedBest] = await Promise.all([
      chosen.useGps ? resolveOrigin() : Promise.resolve(DEFAULT_ORIGIN),
      loadBestScore(),
    ]);
    if (id !== startId.current) return;

    setConfig(chosen);
    setOrigin(resolvedOrigin);
    setPlaces(pickPlaces(resolvedOrigin.coordinates, chosen));
    setBestScore(storedBest);
    setIsNewBest(false);
    setRoundIndex(0);
    startRound(chosen.playerNames.length);
    resetDraft();
    setPhase(chosen.playerNames.length > 1 ? 'handoff' : 'guess');
  }, [resetDraft, startRound]);

  // On attend la lecture des reglages sauvegardes (rechargement direct sur l'ecran de jeu).
  useEffect(() => {
    if (settingsReady) start();
    return () => {
      startId.current += 1;
    };
  }, [settingsReady, start]);

  const ready = useCallback(() => setPhase('guess'), []);

  /** Curseur Distance (surface, en arc) : le compter pour le score. */
  const setSurfaceDistance = useCallback((km: number) => {
    setSurfaceKm(km);
    setDistanceMode('surface');
  }, []);

  /** Curseur Inclinaison (ligne droite) : le compter pour le score. */
  const setStraightDistance = useCallback((km: number) => {
    setStraightKm(km);
    setDistanceMode('straight');
  }, []);

  const currentPlayerIndex = roundOrder[turnPosition] ?? 0;
  const currentPlayer = players[currentPlayerIndex];

  /** Joueurs qui ont deja repondu ce tour-ci, dans l'ordre ou ils ont joue. */
  const answered = useMemo(
    () =>
      roundOrder
        .slice(0, turnPosition)
        .map((index) => ({ player: players[index], guess: guessesByPlayer[index] }))
        .filter((entry): entry is { player: Player; guess: Guess } => entry.guess !== undefined),
    [roundOrder, turnPosition, players, guessesByPlayer],
  );

  const submit = useCallback(() => {
    const place = places[roundIndex];
    if (place === undefined) return;

    const guess: Guess = { bearing, distanceMode, surfaceKm, straightKm };
    const updated = guessesByPlayer.map((existing, index) => (index === currentPlayerIndex ? guess : existing));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (turnPosition + 1 < players.length) {
      setGuessesByPlayer(updated);
      setTurnPosition(turnPosition + 1);
      resetDraft();
      setPhase('handoff');
      return;
    }

    const results = players.map((_, index) => {
      const playerGuess = updated[index] as Guess;
      return { guess: playerGuess, score: scoreRound(origin.coordinates, place, playerGuess) };
    });
    setGuessesByPlayer(updated);
    setRecords((previous) => [...previous, { place, results }]);
    setPhase('reveal');
  }, [
    bearing,
    currentPlayerIndex,
    distanceMode,
    guessesByPlayer,
    origin,
    places,
    players,
    resetDraft,
    roundIndex,
    straightKm,
    surfaceKm,
    turnPosition,
  ]);

  const next = useCallback(() => {
    if (roundIndex + 1 < places.length) {
      setRoundIndex(roundIndex + 1);
      startRound(players.length);
      resetDraft();
      setPhase(isMultiplayer ? 'handoff' : 'guess');
      return;
    }

    const soloTotal = playerTotals(records, players.length)[0];
    if (!isMultiplayer && soloTotal > bestScore) {
      setBestScore(soloTotal);
      setIsNewBest(true);
      saveBestScore(soloTotal);
    }
    setPhase('end');
  }, [bestScore, isMultiplayer, places.length, players.length, records, resetDraft, roundIndex, startRound]);

  return {
    phase,
    config,
    players,
    isMultiplayer,
    currentPlayer,
    playerIndex: currentPlayerIndex,
    answered,
    origin,
    place: places[roundIndex],
    roundNumber: roundIndex + 1,
    totalRounds: places.length,
    bearing,
    distanceMode,
    surfaceKm,
    straightKm,
    maxSurfaceKm: MAX_SURFACE_DISTANCE_KM,
    maxStraightKm: MAX_STRAIGHT_DISTANCE_KM,
    records,
    currentRecord: records[roundIndex],
    totals: playerTotals(records, players.length),
    bestScore,
    isNewBest,
    setBearing,
    setSurfaceDistance,
    setStraightDistance,
    ready,
    submit,
    next,
    restart: start,
  };
};
