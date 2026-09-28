import { PLAYER_COLORS } from '@/data';
import { MAX_SURFACE_DISTANCE_KM } from '@/games/compass/constants';
import { bearingDeg, distanceKm as computeDistanceKm } from '@/helpers';
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

  // Whoever loses the connection leaves the game — host included (see `useRoomPresence`).
  if (game.connectionLost) return <RoomDeletedScreen message={t.setup.online.connectionLostNotice} />;

  // Only a joiner ever sees this: the host is the one who made the room disappear (see
  // `handleQuit`), and it's already navigating itself home in that same tap — showing it this
  // same notice too just traps it behind a modal with nothing to do until the redundant timeout
  // in `useOnlineGame` above catches up. Tappable (like `SetupScreenView`'s own notice overlay)
  // rather than only ever auto-dismissing after 2s: no reason to make a joiner wait it out.
  if (!game.roomExists && !game.isHost) {
    return <RoomDeletedScreen />;
  }

  const { localUid, players, onlinePlayers, isHost, roomSettings, gameState, place, totals, myIndex } = game;

  if (localUid === null || roomSettings === null || place === undefined || gameState.origin === null) {
    return <NoticeOverlay loading message={t.game.loading} onDismiss={() => {}} />;
  }
  const maxDistanceKm = MAX_SURFACE_DISTANCE_KM;
  const myColor = players[localUid]?.color ?? PLAYER_COLORS[0];

  if (gameState.screen === 'end') {
    return (
      <EndScreen onMenu={onQuit} onReplay={onQuit} players={onlinePlayers} records={game.records} totals={totals} />
    );
  }

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
    const confirmedRecord = gameState.screen === 'reveal' ? game.records[game.records.length - 1] : undefined;
    if (gameState.screen === 'reveal' && confirmedRecord === undefined) {
      return <NoticeOverlay loading message={t.game.loading} onDismiss={() => {}} />;
    }

    const answeredPlayers = confirmedRecord
      ? onlinePlayers
      : onlinePlayers.filter(({ uid }) => gameState.guesses[uid] !== undefined);
    const allAnswered = confirmedRecord !== undefined || answeredPlayers.length === onlinePlayers.length;
    const guessFor = (uid: string) =>
      confirmedRecord
        ? confirmedRecord.results[onlinePlayers.findIndex((p) => p.uid === uid)].guess
        : gameState.guesses[uid];
    const trueBearing = confirmedRecord
      ? confirmedRecord.results[0].score.trueBearing
      : allAnswered
        ? bearingDeg(gameState.origin.coordinates, place.coordinates)
        : null;
    const trueSurfaceDistanceKm = confirmedRecord
      ? confirmedRecord.results[0].score.trueSurfaceDistanceKm
      : allAnswered
        ? computeDistanceKm(gameState.origin.coordinates, place.coordinates)
        : 0;

    resultsEarthMarks = [
      ...(allAnswered
        ? [{ bearing: trueBearing as number, distanceKm: trueSurfaceDistanceKm, color: colors.truth, isTruth: true }]
        : []),
      ...answeredPlayers.map(({ uid, color }): EarthMark => {
        const guess = guessFor(uid);
        return {
          bearing: guess.bearing,
          distanceKm: guess.distanceKm,
          color,
          opacity: confirmedRecord ? REVEAL_OPACITY : undefined,
        };
      }),
    ];
    extraNeedles = answeredPlayers.map(({ uid, color }) => ({ bearing: guessFor(uid).bearing, color }));
    truthBearing = trueBearing;
    answered = confirmedRecord ? undefined : onlinePlayers.map(({ uid }) => gameState.guesses[uid] !== undefined);
    confirmed = confirmedRecord !== undefined;
    isLastRound = gameState.roundIndex + 1 >= gameState.places.length;
    record = confirmedRecord ?? buildRoundRecord(place, onlinePlayers, gameState.guesses, {});
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
      difficulty={roomSettings.difficulties[0]}
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
