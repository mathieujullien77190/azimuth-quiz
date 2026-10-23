import { useState } from 'react';

import { PLAYER_COLORS } from '@/data';
import { MAX_SURFACE_DISTANCE_KM } from '@/games/compass/constants';
import { originForRound, travelFromPlace } from '@/games/compass/helpers/originForRound';
import { bearingDeg, distanceKm as computeDistanceKm } from '@/helpers';
import type { OnlinePlayer } from '@/helpers/roomPlayers';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/themes';

import type { EarthMark } from '@/components/EarthSection';
import type { RoundRecord } from '@/types';
import EndScreen from '../EndScreen';
import NoticeOverlay from '@/components/NoticeOverlay';
import RoomDeletedScreen from '@/components/RoomDeletedScreen';
import { REVEAL_OPACITY } from './constants';
import { buildRoundRecord } from './helpers';
import { useSectionScroll } from './useSectionScroll';
import { useTravelNotice } from './useTravelNotice';
import { OnlineGameScreenView } from './OnlineGameScreenView';
import type { Needle, OnlineGameScreenProps } from './types';
import { useOnlineGame } from './useOnlineGame';

/**
 * Pendant en ligne de `GameScreen` : un telephone = un joueur, reponses envoyees a Firestore. L'hote fait
 * le meme parcours mais possede aussi le scoring (dans `useOnlineGame`, les regles reservent
 * `scores`/`screen` a l'hote). Container smart : hook + libelles, rendu par les vues.
 */
export const OnlineGameScreen = ({ code, onQuit }: OnlineGameScreenProps) => {
  const { colors } = useTheme();
  const t = useTranslation();
  const game = useOnlineGame(code, onQuit);

  // Navigation de defilement au-dessus des early returns : l'ordre des hooks ne depend pas de la phase.
  const { scrollRef, onCap, goToCap, goToDistance, handleScroll } = useSectionScroll();

  // Mode voyage des le tour 2 : splash du lieu, seulement quand la manche est vraiment a l'ecran. Au-dessus
  // des early returns (ordre des hooks).
  const roundShown =
    game.gameState.screen !== 'end' &&
    game.localUid !== null &&
    game.roomSettings !== null &&
    game.place !== undefined &&
    originForRound(game.gameState, game.roomSettings.travel) !== null;
  const travelPlace = roundShown ? travelFromPlace(game.gameState, game.roomSettings?.travel) : undefined;
  const travelLocation = travelPlace === undefined ? undefined : t.game.youAreAt(travelPlace.name);
  const { travelNotice, dismissTravelNotice } = useTravelNotice(game.gameState.roundIndex, travelLocation);

  // Classement final fige a la 1re arrivee : "Accueil" fait seulement `router.back()`, les abonnements
  // restent ouverts pendant le fondu, et une maj tardive pourrait reordonner une ligne. Capture au rendu
  // (comme `useGuessDraft`) et non en effet, sans trou ou les valeurs vives flashent.
  const [frozenEnd, setFrozenEnd] = useState<{
    players: OnlinePlayer[];
    records: RoundRecord[];
    totals: number[];
  } | null>(null);
  if (game.gameState.screen === 'end' && frozenEnd === null) {
    setFrozenEnd({ players: game.onlinePlayers, records: game.records, totals: game.totals });
  }

  // L'hote vient de quitter : le store est deja reinitialise, l'ecran sort. Pas le splash "chargement"
  // (room sans etat).
  if (!game.connected) return null;

  // Qui perd la connexion quitte la partie, hote compris (voir `useRoomPresence`).
  if (game.connectionLost) return <RoomDeletedScreen message={t.setup.online.connectionLostNotice} />;

  // La suppression de la room par l'hote n'est pas un early return : le joiner garde sa manche sous la
  // notice "l'hote a quitte" de `useSetupRoom` (qui le renvoie a l'accueil) ; le dernier etat est encore
  // dans le store.

  const { localUid, players, onlinePlayers, isHost, roomSettings, gameState, place, totals, myIndex } = game;

  // Le classement final passe d'abord : a la fin `roundIndex` depasse les manches, ce n'est pas "pas pret"
  // (sinon splash de chargement). `frozenEnd` est encore null au tout 1er rendu en 'end' : les valeurs
  // vives sont identiques, le repli n'est pas une 2e source de verite.
  if (gameState.screen === 'end') {
    const end = frozenEnd ?? { players: onlinePlayers, records: game.records, totals };
    const endLocalName = end.players.find((player) => player.uid === localUid)?.name ?? '';
    return (
      <EndScreen
        localName={endLocalName}
        onQuit={game.handleQuit}
        onReplay={game.handleReplay}
        players={end.players}
        records={end.records}
        totals={end.totals}
      />
    );
  }

  // Depart de la manche : point de la room, ou lieu precedent en mode voyage.
  const roundOrigin = originForRound(gameState, roomSettings?.travel);
  if (localUid === null || roomSettings === null || place === undefined || roundOrigin === null) {
    return <NoticeOverlay loading message={t.game.loading} />;
  }
  const maxDistanceKm = MAX_SURFACE_DISTANCE_KM;
  const myColor = players[localUid]?.color ?? PLAYER_COLORS[0];

  // Une fois envoye, cet appareil passe au meme ecran que le reveal officiel, en version partielle :
  // reponses deja arrivees, vrai cap/distance calcules en local, `RoundResult` en forme `pending`, et un
  // pied "attente" jusqu'a ce que `gameState.screen` passe a 'reveal'.
  const submitted = gameState.screen === 'game' && gameState.guesses[localUid] !== undefined;
  const showResults = gameState.screen === 'reveal' || submitted;

  // Tout alimente une seule `OnlineGameScreenView` : `record` bascule entre les deux mises en page sans
  // remplacer le composant (ce qui reinitialisait le defilement natif).
  let record: RoundRecord | undefined;
  let extraNeedles: Needle[] = [];
  let truthBearing: number | null = null;
  let answered: boolean[] | undefined;
  let confirmed = false;
  let isLastRound = false;
  let resultsEarthMarks: EarthMark[] = [];

  if (showResults) {
    const revealed = gameState.screen === 'reveal';
    // La manche revelee est lue dans la room (`guesses`, `scores` par uid), pas dans un enregistrement
    // indexe sur les joueurs d'alors : un joueur parti puis revenu, ou arrive en retard, ne s'alignerait
    // plus.
    if (revealed && gameState.scores === null) {
      return <NoticeOverlay loading message={t.game.loading} />;
    }

    const answeredPlayers = onlinePlayers.filter(({ uid }) => gameState.guesses[uid] !== undefined);
    const allAnswered = revealed || answeredPlayers.length === onlinePlayers.length;
    const trueBearing = allAnswered ? bearingDeg(roundOrigin, place.coordinates) : null;
    const trueSurfaceDistanceKm = allAnswered ? computeDistanceKm(roundOrigin, place.coordinates) : 0;

    resultsEarthMarks = [
      ...(allAnswered
        ? [{ bearing: trueBearing as number, distanceKm: trueSurfaceDistanceKm, color: colors.truth, isTruth: true }]
        : []),
      ...answeredPlayers.map(({ uid, color }): EarthMark => {
        const guess = gameState.guesses[uid];
        return {
          bearing: guess.bearing,
          distanceKm: guess.distanceKm,
          color,
          opacity: revealed ? REVEAL_OPACITY : undefined,
        };
      }),
    ];
    extraNeedles = answeredPlayers.map(({ uid, color }) => ({ bearing: gameState.guesses[uid].bearing, color }));
    truthBearing = trueBearing;
    answered = revealed ? undefined : onlinePlayers.map(({ uid }) => gameState.guesses[uid] !== undefined);
    confirmed = revealed;
    isLastRound = gameState.roundIndex + 1 >= gameState.places.length;
    record = buildRoundRecord(place, onlinePlayers, gameState.guesses, gameState.scores ?? {});
  }

  // Marque Terre de la phase reponse : seulement la reponse de cet appareil (ignoree par la vue une fois
  // `record` defini).
  const answerEarthMarks: EarthMark[] = [{ bearing: game.bearing, distanceKm: game.distanceKm, color: myColor }];

  return (
    <>
      <OnlineGameScreenView
        answered={answered}
        onReact={game.reactions.canReact ? game.reactions.send : undefined}
        reaction={game.reactions.reaction}
        bearing={game.bearing}
        compassColor={myColor}
        confirmed={confirmed}
        difficulty={roomSettings.difficulty}
        distanceKm={game.distanceKm}
        earthMarks={record ? resultsEarthMarks : answerEarthMarks}
        location={travelLocation}
        origin={roundOrigin}
        extraNeedles={extraNeedles}
        name={onlinePlayers[myIndex]?.name ?? ''}
        points={totals[myIndex] ?? 0}
        roomCode={code}
        isHost={isHost}
        isLastRound={isLastRound}
        liveCompass={roomSettings.liveCompass}
        localIndex={myIndex}
        maxDistanceKm={maxDistanceKm}
        onCap={onCap}
        onGoToCap={goToCap}
        onGoToDistance={goToDistance}
        onKick={game.kickPlayer}
        onNextRound={game.goToNextRound}
        onQuit={game.handleQuit}
        onScroll={handleScroll}
        onSetBearing={game.setBearing}
        onSetDistanceKm={game.setDistanceKm}
        onSubmit={game.submit}
        place={place}
        players={onlinePlayers}
        record={record}
        roundNumber={gameState.roundIndex + 1}
        scrollRef={scrollRef}
        showCountry={roomSettings.showCountry}
        submitDisabled={!game.bearingTouched || !game.distanceTouched}
        totalRounds={gameState.places.length}
        totals={totals}
        truthBearing={truthBearing}
      />
      <NoticeOverlay message={travelNotice} onDismiss={dismissTravelNotice} />
    </>
  );
};
