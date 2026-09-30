import { useState } from 'react';

import { PLAYER_COLORS } from '@/data';
import { MAX_SURFACE_DISTANCE_KM } from '@/games/compass/constants';
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
import { OnlineGameScreenView } from './OnlineGameScreenView';
import type { Needle, OnlineGameScreenProps } from './types';
import { useOnlineGame } from './useOnlineGame';

/**
 * Online counterpart to `GameScreen`: one phone = one player (no turn-passing, no `PlayerTabs`),
 * guesses submitted to Firestore instead of scored locally. The host's own device runs the exact
 * same "answer, submit" flow as everyone else here — it just also happens to own the scoring
 * effect (inside `useOnlineGame`), since the room's security rules only let the host write
 * `scores`/`screen`. Smart container: `useOnlineGame()` + every derived array/label, mapped onto
 * `OnlineAnswerView`/`OnlineResultsView` (pure rendering).
 */
export const OnlineGameScreen = ({ code, onQuit }: OnlineGameScreenProps) => {
  const { colors } = useTheme();
  const t = useTranslation();
  const game = useOnlineGame(code, onQuit);

  // The "Suivant"/"Précédent" scroll nav — kept above every early return below so the hook order
  // never depends on which phase we're in.
  const { scrollRef, onCap, goToCap, goToDistance, handleScroll } = useSectionScroll();

  // The final standings, frozen the first time they're reached: "Accueil" only navigates back
  // (`router.back()`, see the route) rather than disconnecting, so the room's live subscriptions
  // stay open and reactive for as long as this screen is still fading out — without this, a
  // trailing update (another player also leaving...) could visibly reorder/pop a row mid-fade.
  // Captured while rendering (React's "reset/derive state from a prop" pattern, same one
  // `useGuessDraft` uses) rather than in an effect, so there's no gap where the live values would
  // flash before the freeze takes hold.
  const [frozenEnd, setFrozenEnd] = useState<{
    players: OnlinePlayer[];
    records: RoundRecord[];
    totals: number[];
  } | null>(null);
  if (game.gameState.screen === 'end' && frozenEnd === null) {
    setFrozenEnd({ players: game.onlinePlayers, records: game.records, totals: game.totals });
  }

  // The host just quit: the store is already reset, and this screen is only on its way out. Not the
  // "loading" splash below — that one is for a room that hasn't delivered its state yet.
  if (!game.connected) return null;

  // Whoever loses the connection leaves the game — host included (see `useRoomPresence`).
  if (game.connectionLost) return <RoomDeletedScreen message={t.setup.online.connectionLostNotice} />;

  // The host deleting the room is no early return: a joiner keeps seeing the round it was in, under the
  // "the host left" notice `useSetupRoom` shows (it also sends the joiner home, on a tap or after a
  // couple of seconds) — the last state the room delivered is still in the store.

  const { localUid, players, onlinePlayers, isHost, roomSettings, gameState, place, totals, myIndex } = game;

  // The final standings come first: once the last round is over `roundIndex` points past the rounds, so
  // there is no round left to load — reading that as "not ready yet" showed the loading splash instead.
  // `frozenEnd` is still null on this very first render reaching 'end' (the `setFrozenEnd` call above
  // only takes effect from the next render on) — the live values are identical at this instant, so
  // falling back to them here is not a second source of truth, just this one render's gap.
  if (gameState.screen === 'end') {
    const end = frozenEnd ?? { players: onlinePlayers, records: game.records, totals };
    const endLocalName = end.players.find((player) => player.uid === localUid)?.name ?? '';
    return (
      <EndScreen
        localName={endLocalName}
        onMenu={onQuit}
        players={end.players}
        records={end.records}
        totals={end.totals}
      />
    );
  }

  if (localUid === null || roomSettings === null || place === undefined || gameState.origin === null) {
    return <NoticeOverlay loading message={t.game.loading} />;
  }
  const maxDistanceKm = MAX_SURFACE_DISTANCE_KM;
  const myColor = players[localUid]?.color ?? PLAYER_COLORS[0];

  // Once this device has submitted, it moves to the *exact same* results-style screen as the
  // official reveal — just with a live, partial version of it: whichever players have answered so
  // far (their needle/mark), the true heading/distance (computed client-side from `origin`/
  // `place`, already known to everyone — no need to wait on the host's `finishRoomRound`
  // round-trip) once the round is fully answered, and a `RoundResult` already in its `pending`
  // shape (see that component) rather than no scores at all — a "waiting" footer stands in for
  // the host's "next round" button until `gameState.screen` actually flips to `'reveal'`.
  const submitted = gameState.screen === 'game' && gameState.guesses[localUid] !== undefined;
  const showResults = gameState.screen === 'reveal' || submitted;

  // Everything below feeds one `OnlineGameScreenView` (single `Screen`/`ScrollView`, see its own
  // comment): the results-only values default to `undefined`/empty while still answering, so the
  // view's `record` discriminant is the only thing switching between the two layouts — never a
  // full component swap, which used to reset the native scroll position on submit.
  let record: RoundRecord | undefined;
  let extraNeedles: Needle[] = [];
  let truthBearing: number | null = null;
  let answered: boolean[] | undefined;
  let confirmed = false;
  let isLastRound = false;
  let resultsEarthMarks: EarthMark[] = [];

  if (showResults) {
    const revealed = gameState.screen === 'reveal';
    // The revealed round is read from the room itself (`guesses` and `scores`, both keyed by uid),
    // never from a record stored when the reveal first arrived: that one is indexed by the players
    // *at that moment*, so a player who left before answering and came back — or joined late — no
    // longer lined up with it.
    if (revealed && gameState.scores === null) {
      return <NoticeOverlay loading message={t.game.loading} />;
    }

    const answeredPlayers = onlinePlayers.filter(({ uid }) => gameState.guesses[uid] !== undefined);
    const allAnswered = revealed || answeredPlayers.length === onlinePlayers.length;
    const trueBearing = allAnswered ? bearingDeg(gameState.origin.coordinates, place.coordinates) : null;
    const trueSurfaceDistanceKm = allAnswered ? computeDistanceKm(gameState.origin.coordinates, place.coordinates) : 0;

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

  // Answer phase's own Earth mark: only this device's own guess, shown regardless of phase (the
  // view ignores it once `record` is set).
  const answerEarthMarks: EarthMark[] = [{ bearing: game.bearing, distanceKm: game.distanceKm, color: myColor }];

  return (
    <OnlineGameScreenView
      answered={answered}
      bearing={game.bearing}
      compassColor={myColor}
      confirmed={confirmed}
      difficulty={roomSettings.difficulty}
      distanceKm={game.distanceKm}
      earthMarks={record ? resultsEarthMarks : answerEarthMarks}
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
  );
};
