import { Text, View } from 'react-native';

import { formatNumber } from '@/helpers';
import { useLanguage, useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import GameFooter from '@/components/GameFooter';
import GameHeader from '@/components/GameHeader';
import Button from '@/components/ui/Button';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import ContourFullBleedScreen from '../../components/ContourFullBleedScreen';
import ContourGuessBar from '../../components/ContourGuessBar';
import { CONTOUR_MAX_HINTS } from '../../constants';
import { buildHintLabels, precisionLevel } from '../../helpers/roundBoard';
import { useRoundBoard } from '../../helpers/useRoundBoard';
import type { OnlineContourGameScreenViewProps } from './types';

import { createStyles } from './OnlineContourGameScreenView.styles';

/** Tier at which the board shows everything, name included (see `buildHintLabels`). */
const ALL_HINTS = CONTOUR_MAX_HINTS;

/**
 * Pur rendu, un seul ecran plein cadre pour les 3 etats (tour actif, en attente, manche revelee) :
 * jamais de swap de composant entre eux. La geometrie du plateau est mesuree ici (`useRoundBoard`,
 * un simple etat de mise en page, pas de logique metier) comme le fait `ContourGameScreen` en local.
 */
export const OnlineContourGameScreenView = ({
  onQuit,
  name,
  points,
  roomCode,
  roundNumber,
  totalRounds,
  difficulty,
  country,
  hintsRevealed,
  simplifySeed,
  pointsAtStake,
  players,
  turnIndex,
  isMyTurn,
  turnPlayerName,
  verdict,
  winnerName,
  lastWrong,
  guessText,
  onChangeGuessText,
  onSubmitGuess,
  onRevealHint,
  onGiveUp,
  isHost,
  isLastRound,
  onNextRound,
}: OnlineContourGameScreenViewProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const { language } = useLanguage();
  const roundOver = verdict !== undefined;

  const { board, onBoardAreaLayout, onOverlayTopLayout, onOverlayBottomLayout } = useRoundBoard(
    country,
    true,
    simplifySeed,
  );
  const shownHints = roundOver ? ALL_HINTS : hintsRevealed;
  const hintLabels = buildHintLabels(board, shownHints, language);

  const footer = roundOver ? (
    <View style={styles.footer}>
      {verdict === 'correct' ? (
        <Text style={styles.banner}>{t.contourGame.found(winnerName ?? '', formatNumber(pointsAtStake))}</Text>
      ) : (
        <NoOneFoundText players={players.map((player) => player.name)} />
      )}
      {isHost ? (
        <Button label={isLastRound ? t.game.last : t.contourGame.continueLabel} onPress={onNextRound} />
      ) : (
        <Text style={styles.waiting}>{t.game.waitingForOthers}</Text>
      )}
    </View>
  ) : !isMyTurn ? (
    <Text style={styles.waiting}>{t.contourGame.waitingForTurn(turnPlayerName)}</Text>
  ) : hintsRevealed >= ALL_HINTS ? (
    <View style={styles.footer}>
      <NoOneFoundText players={players.map((player) => player.name)} />
      <Button label={t.contourGame.continueLabel} onPress={onGiveUp} />
    </View>
  ) : (
    <View style={styles.footer}>
      <Text style={styles.pointsAtStake}>{t.contourGame.pointsAtStake(formatNumber(pointsAtStake))}</Text>
      <ContourGuessBar
        guessText={guessText}
        onChangeGuessText={onChangeGuessText}
        onHint={onRevealHint}
        onSubmit={onSubmitGuess}
        wrongText={lastWrong !== null ? t.contourGame.wrongGuess(lastWrong) : null}
      />
    </View>
  );

  return (
    <ContourFullBleedScreen
      board={board}
      footer={<GameFooter>{footer}</GameFooter>}
      header={
        <GameHeader
          code={roomCode}
          difficulty={difficulty}
          name={name}
          onQuit={onQuit}
          players={players}
          points={points}
          question={roundOver ? undefined : t.contourGame.guessPrompt}
          roundNumber={roundNumber}
          totalRounds={totalRounds}
          turnIndex={roundOver ? -1 : turnIndex}
        />
      }
      hintLabels={hintLabels}
      precision={precisionLevel(shownHints)}
      onBoardAreaLayout={onBoardAreaLayout}
      onOverlayBottomLayout={onOverlayBottomLayout}
      onOverlayTopLayout={onOverlayTopLayout}
      roundKey={roundNumber}
    />
  );
};
