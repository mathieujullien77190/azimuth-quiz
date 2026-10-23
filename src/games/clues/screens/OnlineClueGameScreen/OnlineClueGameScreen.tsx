import { useTransientFlag } from '@/helpers/useTransientFlag';
import { useTranslation } from '@/i18n';

import DifficultyFeedbackOverlay from '@/components/DifficultyFeedbackOverlay';
import FinalStandings from '@/components/FinalStandings';
import NoticeOverlay from '@/components/NoticeOverlay';
import RoomDeletedScreen from '@/components/RoomDeletedScreen';
import { OnlineClueGameScreenView } from './OnlineClueGameScreenView';
import type { OnlineClueGameScreenProps } from './types';
import { useOnlineClueGame } from './useOnlineClueGame';

/** Duree d'affichage de la notice "pas ton tour" avant fermeture automatique. */
const NOT_YOUR_TURN_NOTICE_MS = 4000;

/** Pendant en ligne de `ClueGameScreen` : un telephone = un joueur, un plateau partage devoile tour a tour. Container smart de `OnlineClueGameScreenView`. */
export const OnlineClueGameScreen = ({ code, onQuit }: OnlineClueGameScreenProps) => {
  const t = useTranslation();
  const game = useOnlineClueGame(code, onQuit);
  // Indice touche hors de son tour : notice courte, fermee seule ou au tap.
  const notYourTurn = useTransientFlag(NOT_YOUR_TURN_NOTICE_MS);

  // L'hote vient de quitter : store deja remis a zero, l'ecran n'est plus qu'en sortie (different du splash "chargement").
  if (!game.connected) return null;

  // Qui perd la connexion quitte la partie, hote compris (voir `useRoomPresence`).
  if (game.connectionLost) return <RoomDeletedScreen message={t.setup.online.connectionLostNotice} />;

  // Room supprimee par l'hote : pas de early return, le joiner garde la manche sous la notice de `useSetupRoom` (dernier etat encore dans le store).

  const { localUid, onlinePlayers, roundPlayers, isHost, roomSettings, gameState, place } = game;

  // Le classement final d'abord : apres la derniere manche `roundIndex` depasse les manches, le lire comme "pas pret" montrerait le splash.
  if (gameState.screen === 'end') {
    // Le score est un compte a rebours qu'on gagne : le total le plus HAUT gagne.
    return (
      <>
        <FinalStandings
          entries={onlinePlayers.map((player) => ({
            name: player.name,
            total: gameState.totalScores[player.uid] ?? 0,
            color: player.color,
          }))}
          localName={onlinePlayers.find((player) => player.uid === localUid)?.name ?? ''}
          onQuit={game.handleQuit}
          onReplay={game.handleReplay}
          title={t.endScreen.title}
        />
        <DifficultyFeedbackOverlay
          onChoose={game.devFeedback.choose}
          onDismiss={game.devFeedback.dismiss}
          question={game.devFeedback.question}
        />
      </>
    );
  }

  if (localUid === null || roomSettings === null || place === undefined || gameState.origin === null) {
    return <NoticeOverlay loading message={t.game.loading} />;
  }

  const myName = onlinePlayers.find((p) => p.uid === localUid)?.name ?? '';
  // Les onglets suivent l'ordre de la manche (`roundPlayers`) : l'index du tour se lit sur cette liste.
  const turnIndex = roundPlayers.findIndex((p) => p.uid === gameState.turnUid);
  const turnPlayerName = roundPlayers[turnIndex]?.name ?? '';
  const winnerName =
    gameState.roundWinnerUid !== null
      ? (onlinePlayers.find((p) => p.uid === gameState.roundWinnerUid)?.name ?? '')
      : undefined;
  const isLastRound = gameState.roundIndex + 1 >= gameState.places.length;

  return (
    <>
      <OnlineClueGameScreenView
        onReact={game.reactions.canReact ? game.reactions.send : undefined}
        reaction={game.reactions.reaction}
        bearingDeg={game.bearing}
        difficulty={roomSettings.difficulty}
        distanceKm={game.distance}
        origin={game.origin}
        guessText={game.guessText}
        name={myName}
        points={gameState.totalScores[localUid] ?? 0}
        roomCode={code}
        isHost={isHost}
        isLastRound={isLastRound}
        iWon={gameState.roundWinnerUid !== null && gameState.roundWinnerUid === localUid}
        guessedThisTurn={game.guessedThisTurn}
        isMyTurn={game.isMyTurn}
        wrongGuesserName={game.wrongGuesserName}
        onChangeGuessText={game.setGuessText}
        onGiveUp={game.giveUp}
        onNextRound={game.goToNextRound}
        notice={notYourTurn.visible ? t.cluesGame.notYourTurn(turnPlayerName) : null}
        onDismissNotice={notYourTurn.hide}
        typedByActivePlayer={game.typedByActivePlayer}
        onPickClue={game.isMyTurn ? game.pickClue : notYourTurn.show}
        onQuit={game.handleQuit}
        onSubmitGuess={game.submitGuess}
        place={place}
        players={roundPlayers}
        remaining={game.remaining}
        revealedClueIds={gameState.revealedClueIds}
        roundNumber={gameState.roundIndex + 1}
        skeletonGroups={game.skeletonGroups}
        skeletonLengthKnown={game.skeletonLengthKnown}
        totalRounds={gameState.places.length}
        turnIndex={turnIndex}
        verdict={gameState.verdict ?? undefined}
        winnerName={winnerName}
      />
      <DifficultyFeedbackOverlay
        onChoose={game.devFeedback.choose}
        onDismiss={game.devFeedback.dismiss}
        question={game.devFeedback.question}
      />
    </>
  );
};
