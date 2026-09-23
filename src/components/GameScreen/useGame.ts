import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from '@/i18n';
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

/** Cap de depart par defaut : le nord, aiguille deja visible et deplacable. */
const DEFAULT_BEARING = 0;

/** Brouillon d'un joueur (aiguille + distance) avant validation. `*Touched` distingue une valeur
 * vraiment choisie par le joueur d'une valeur restee a son defaut (jamais touchee) : "Valider"
 * s'appuie dessus pour ne pas enregistrer une reponse au hasard. */
type Draft = { bearing: number; distanceKm: number; bearingTouched: boolean; distanceTouched: boolean };

/** Brouillon de depart : aiguille au nord, distance par defaut, rien encore touche. */
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
  const deviceOriginNameRef = useRef(t.common.yourPosition);
  useEffect(() => {
    deviceOriginNameRef.current = t.common.yourPosition;
  }, [t.common.yourPosition]);

  // Reglages figes au lancement : les modifier ailleurs ne change pas la partie en cours.
  const [config, setConfig] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [origin, setOrigin] = useState<Origin>(DEFAULT_ORIGIN);
  const [places, setPlaces] = useState<Place[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  // Ordre d'affichage des onglets : par score cumule avant cette manche, le plus haut en premier
  // (purement visuel : on peut choisir n'importe quel onglet dans n'importe quel ordre).
  const [roundOrder, setRoundOrder] = useState<number[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [guessesByPlayer, setGuessesByPlayer] = useState<(Guess | undefined)[]>([]);
  const [records, setRecords] = useState<RoundRecord[]>([]);
  // Brouillon (aiguille + distance, curseur de distance : surface en mode classique, corde en mode
  // straightLine) de CHAQUE joueur, y compris non valide : change d'onglet via PlayerTabs ne doit
  // jamais faire perdre une reponse en cours de saisie, meme avant le clic sur "Valider".
  const [draftsByPlayer, setDraftsByPlayer] = useState<Draft[]>([]);

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

  /** Brouillon du joueur actif : sa reponse en cours (validee ou non). */
  const activeDraft = draftsByPlayer[activePlayerIndex] ?? DEFAULT_DRAFT;
  const bearing = activeDraft.bearing;
  const distanceKm = activeDraft.distanceKm;
  const bearingTouched = activeDraft.bearingTouched;
  const distanceTouched = activeDraft.distanceTouched;

  /** Met a jour uniquement le brouillon du joueur actif, sans toucher aux autres. */
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
   * Nouvelle manche : chaque joueur repart avec un brouillon vierge, les onglets en rotation pure
   * (voir `rotatedOrder`) pour que le premier a jouer change a chaque manche, equitablement.
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
    setPlaces(pickPlaces(resolvedOrigin.coordinates, chosen));
    setRoundIndex(0);
    setRecords([]);
    startRound(chosen.playerNames.length, 0);
    setPhase('guess');
  }, [startRound]);

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

  /**
   * Enregistre la reponse du joueur actif a partir de son brouillon courant. Renvoie le tableau
   * des reponses a jour et si tout le monde a maintenant repondu — ne declenche JAMAIS la
   * revelation elle-meme : ca reste le seul travail de "Valider" (voir `submit`), pour que passer
   * sur un autre onglet (meme si c'etait la derniere reponse manquante) n'affiche jamais la
   * reponse tout seul.
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

  /** Calcule les scores et passe en revelation. */
  const reveal = useCallback(
    (updated: (Guess | undefined)[]) => {
      const place = places[roundIndex];
      if (place === undefined) return;

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
   * Change d'onglet. Cliquer directement sur un autre joueur valide d'abord la reponse en cours
   * (comme "Valider"), puis bascule sur le joueur choisi — meme si cette validation vient de
   * repondre au dernier joueur manquant, la revelation n'apparait pas : il faut appuyer sur
   * "Valider" pour l'obtenir.
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

  /** Bouton "Valider" : seul chemin qui revele la reponse, une fois tout le monde repondu. */
  const submit = useCallback(() => {
    const { updated, complete } = commitActiveGuess();
    if (complete) {
      reveal(updated);
      return;
    }

    const nextUnanswered = roundOrder.find((index) => updated[index] === undefined);
    if (nextUnanswered !== undefined) setActivePlayerIndex(nextUnanswered);
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
