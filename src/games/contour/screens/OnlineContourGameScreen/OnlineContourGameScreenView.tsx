import { Text, View } from 'react-native';

import { formatNumber } from '@/helpers';
import { useLanguage, useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import GameFooter from '@/components/GameFooter';
import GameHeader from '@/components/GameHeader';
import Button from '@/components/ui/Button';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import NoticeOverlay from '@/components/NoticeOverlay';
import ContourFullBleedScreen from '../../components/ContourFullBleedScreen';
import ContourGuessBar from '../../components/ContourGuessBar';
import ContourHintList from '../../components/ContourHintList';
import { buildHintLabels } from '../../helpers/roundBoard';
import { useRoundBoard } from '../../helpers/useRoundBoard';
import type { OnlineContourGameScreenViewProps } from './types';

import { createStyles } from './OnlineContourGameScreenView.styles';

const noop = () => {};

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
  neighborCountries,
  plan,
  hintGroups,
  hintsRevealed,
  simplifySeed,
  pointsAtStake,
  players,
  turnIndex,
  isMyTurn,
  verdict,
  winnerName,
  lastWrong,
  typedByActivePlayer,
  notice,
  onDismissNotice,
  onNotYourTurn,
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
    neighborCountries,
  );
  // A finished round shows everything, the country included.
  const shownHints = roundOver ? plan.length : hintsRevealed;
  const hintLabels = buildHintLabels(board, plan, shownHints, language);

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
    <View style={styles.footer}>
      <ContourHintList disabled groups={hintGroups} onPick={onRevealHint} />
      <ContourGuessBar
        guessText={typedByActivePlayer}
        onChangeGuessText={noop}
        onReadOnlyPress={onNotYourTurn}
        onSubmit={noop}
        readOnly
      />
    </View>
  ) : hintsRevealed >= plan.length ? (
    <View style={styles.footer}>
      <NoOneFoundText players={players.map((player) => player.name)} />
      <Button label={t.contourGame.continueLabel} onPress={onGiveUp} />
    </View>
  ) : (
    <View style={styles.footer}>
      <Text style={styles.pointsAtStake}>{t.contourGame.pointsAtStake(formatNumber(pointsAtStake))}</Text>
      <ContourHintList groups={hintGroups} onPick={onRevealHint} />
      <ContourGuessBar
        guessText={guessText}
        onChangeGuessText={onChangeGuessText}
        onSubmit={onSubmitGuess}
        wrongText={lastWrong !== null ? t.contourGame.wrongGuess(lastWrong) : null}
      />
    </View>
  );

  return (
    <>
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
        hintsRevealed={shownHints}
        plan={plan}
        onBoardAreaLayout={onBoardAreaLayout}
        onOverlayBottomLayout={onOverlayBottomLayout}
        onOverlayTopLayout={onOverlayTopLayout}
        roundKey={roundNumber}
      />
      <NoticeOverlay message={notice} onDismiss={onDismissNotice} />
    </>
  );
};
