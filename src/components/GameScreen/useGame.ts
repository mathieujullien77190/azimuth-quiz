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
import {
  inclinationFromChordKm,
  loadBestScore,
  pickPlaces,
  playerDisplayName,
  resolveOrigin,
  saveBestScore,
  scoreRound,
  shuffle,
} from '@/helpers';
import { useSettings } from '@/settings';
import type { GamePhase, GameSettings, Guess, Origin, Place, Player, RoundRecord } from '@/types';

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
  // Ordre d'affichage des onglets, tire au sort a chaque nouveau lieu (purement visuel : on peut
  // choisir n'importe quel onglet dans n'importe quel ordre).
  const [roundOrder, setRoundOrder] = useState<number[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [guessesByPlayer, setGuessesByPlayer] = useState<(Guess | undefined)[]>([]);
  const [records, setRecords] = useState<RoundRecord[]>([]);
  const [bearing, setBearing] = useState(DEFAULT_BEARING);
  // Le seul curseur de distance : surface en mode classique, corde (ligne droite) en mode straightLine.
  const [distanceKm, setDistanceKm] = useState(DEFAULT_DISTANCE_KM);
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
  const maxDistanceKm = config.straightLine ? MAX_STRAIGHT_DISTANCE_KM : MAX_SURFACE_DISTANCE_KM;

  /** Aiguille au nord, curseur a sa valeur de depart (nouveau joueur non repondu, ou nouvelle manche). */
  const resetDraft = useCallback(() => {
    setBearing(DEFAULT_BEARING);
    setDistanceKm(DEFAULT_DISTANCE_KM);
  }, []);

  /** Recharge la reponse deja donnee par un joueur, pour la modifier (option "Modifier apres validation"). */
  const loadDraft = useCallback((guess: Guess) => {
    setBearing(guess.bearing);
    setDistanceKm(guess.distanceKm);
  }, []);

  const startRound = useCallback((playerCount: number) => {
    const order = shuffle(Array.from({ length: playerCount }, (_, index) => index));
    setRoundOrder(order);
    setActivePlayerIndex(order[0] ?? 0);
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
    setPhase('guess');
  }, [resetDraft, startRound]);

  // On attend la lecture des reglages sauvegardes (rechargement direct sur l'ecran de jeu).
  useEffect(() => {
    if (settingsReady) start();
    return () => {
      startId.current += 1;
    };
  }, [settingsReady, start]);

  const currentPlayer = players[activePlayerIndex];

  /** Reponses deja validees des AUTRES joueurs (pas celui en cours d'edition) : a montrer en estompe. */
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

  /** Un joueur par index : a-t-il deja valide sa reponse ce tour-ci ? */
  const answeredByPlayer = useMemo(() => guessesByPlayer.map((guess) => guess !== undefined), [guessesByPlayer]);

  /** Change d'onglet : recharge la reponse existante si on revient modifier, sinon repart a zero. */
  const selectPlayer = useCallback(
    (index: number) => {
      if (index === activePlayerIndex) return;
      const existing = guessesByPlayer[index];
      const locked = existing !== undefined && !config.allowRevision;
      if (locked) return;

      setActivePlayerIndex(index);
      if (existing !== undefined) loadDraft(existing);
      else resetDraft();
    },
    [activePlayerIndex, config.allowRevision, guessesByPlayer, loadDraft, resetDraft],
  );

  const submit = useCallback(() => {
    const place = places[roundIndex];
    if (place === undefined) return;

    const guess: Guess = {
      bearing,
      distanceKm,
      inclination: config.straightLine ? inclinationFromChordKm(distanceKm) : 0,
    };
    const updated = guessesByPlayer.map((existing, index) => (index === activePlayerIndex ? guess : existing));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setGuessesByPlayer(updated);

    const nextUnanswered = roundOrder.find((index) => updated[index] === undefined);
    if (nextUnanswered !== undefined) {
      setActivePlayerIndex(nextUnanswered);
      resetDraft();
      return;
    }

    const results = players.map((_, index) => {
      const playerGuess = updated[index] as Guess;
      return { guess: playerGuess, score: scoreRound(origin.coordinates, place, playerGuess, config) };
    });
    setRecords((previous) => [...previous, { place, results }]);
    setPhase('reveal');
  }, [
    activePlayerIndex,
    bearing,
    config,
    distanceKm,
    guessesByPlayer,
    origin,
    places,
    players,
    resetDraft,
    roundIndex,
    roundOrder,
  ]);

  const next = useCallback(() => {
    if (roundIndex + 1 < places.length) {
      setRoundIndex(roundIndex + 1);
      startRound(players.length);
      resetDraft();
      setPhase('guess');
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
    maxDistanceKm,
    records,
    currentRecord: records[roundIndex],
    totals: playerTotals(records, players.length),
    bestScore,
    isNewBest,
    setBearing,
    setDistanceKm,
    selectPlayer,
    submit,
    next,
    restart: start,
  };
};
