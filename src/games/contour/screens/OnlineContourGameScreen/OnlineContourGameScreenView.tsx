import { Text, View } from 'react-native';

import { formatNumber } from '@/helpers';
import { useLanguage, useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import GameFooter from '@/components/GameFooter';
import TypedAnswer from '@/components/TypedAnswer';
import { typedSkeleton } from '@/components/TypedAnswer/helpers';
import ReactionOverlay from '@/components/ReactionOverlay';
import GameHeader from '@/components/GameHeader';
import Button from '@/components/ui/Button';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import NoticeOverlay from '@/components/NoticeOverlay';
import ContourFullBleedScreen from '../../components/ContourFullBleedScreen';
import ContourGuessBar from '../../components/ContourGuessBar';
import ContourHintList from '../../components/ContourHintList';
import ContourQuadrantMask from '../../components/ContourQuadrantMask';
import { CONTOUR_WRONG_GUESS_PENALTY } from '../../constants';
import { buildHintLabels, flagRects } from '../../helpers/roundBoard';
import { useRoundBoard } from '../../helpers/useRoundBoard';
import type { OnlineContourGameScreenViewProps } from './types';

import { createStyles } from './OnlineContourGameScreenView.styles';

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
  reaction,
  onReact,
  roundNumber,
  totalRounds,
  difficulty,
  country,
  neighborCountries,
  plan,
  hintGroups,
  hintsRevealed,
  hiddenQuadrants,
  onRevealQuadrant,
  canOpenQuadrant,
  quadrantCost,
  simplifySeed,
  pointsAtStake,
  players,
  turnIndex,
  isMyTurn,
  guessedThisTurn,
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

  // The country as it is typed, boxed like Indices does, where the points at stake used to be: the turn-holder's own
  // draft on his device, what he is typing live (`typing`) on every other one — whose own draft stays in their field.
  const typedLine = <TypedAnswer groups={typedSkeleton(isMyTurn ? guessText : typedByActivePlayer)} />;
  const stakeLabel = `${formatNumber(pointsAtStake)} ${t.common.pts}`;

  const footer = roundOver ? (
    <View style={styles.footer}>
      {verdict === 'correct' ? (
        <Text style={styles.banner}>{t.contourGame.found(winnerName ?? '', formatNumber(pointsAtStake))}</Text>
      ) : (
        <NoOneFoundText large players={players.map((player) => player.name)} />
      )}
      {isHost && <Button label={isLastRound ? t.game.last : t.contourGame.continueLabel} onPress={onNextRound} />}
    </View>
  ) : !isMyTurn ? (
    <View style={styles.footer}>
      {/* Every hint is out: nothing is at stake any more, say it to the players waiting for the turn-holder. */}
      {hintsRevealed >= plan.length ? <NoOneFoundText large players={players.map((player) => player.name)} /> : typedLine}
      <ContourHintList disabled groups={hintGroups} onPick={onRevealHint} />
      <ContourGuessBar
        canSubmit={false}
        guessText={guessText}
        label={t.contourGame.guessLabel}
        onChangeGuessText={onChangeGuessText}
        onNotYourTurn={onNotYourTurn}
        onSubmit={onSubmitGuess}
      />
    </View>
  ) : hintsRevealed >= plan.length ? (
    <View style={styles.footer}>
      <NoOneFoundText large players={players.map((player) => player.name)} />
      <Button label={t.contourGame.continueLabel} onPress={onGiveUp} />
    </View>
  ) : (
    <View style={styles.footer}>
      {typedLine}
      <ContourHintList groups={hintGroups} onPick={onRevealHint} />
      <ContourGuessBar
        canSubmit={!guessedThisTurn}
        guessText={guessText}
        label={t.contourGame.guessLabel}
        lockedText={guessedThisTurn ? t.game.alreadyGuessed : null}
        onChangeGuessText={onChangeGuessText}
        onSubmit={onSubmitGuess}
        wrongText={lastWrong !== null ? t.contourGame.wrongGuess(lastWrong, formatNumber(CONTOUR_WRONG_GUESS_PENALTY)) : null}
      />
    </View>
  );

  return (
    <>
      <ContourFullBleedScreen
        board={board}
        boardOverlay={
          // A finished round shows the whole country.
          roundOver ? undefined : (
            <ContourQuadrantMask
              canReveal={isMyTurn && canOpenQuadrant}
              costLabel={t.contourGame.quadrantCost(formatNumber(quadrantCost))}
              flagBoxes={flagRects(board, plan, shownHints)}
              height={board.height}
              hidden={hiddenQuadrants}
              labelFor={(index) => t.contourGame.quadrantLabel(index + 1)}
              onReveal={onRevealQuadrant}
              width={board.width}
            />
          )
        }
        footer={<GameFooter onReact={onReact}>{footer}</GameFooter>}
        header={
          <GameHeader
            code={roomCode}
            difficulty={difficulty}
            name={name}
            onQuit={onQuit}
            players={players}
            points={points}
            question={roundOver ? undefined : t.contourGame.guessPrompt}
            questionDetail={roundOver ? undefined : stakeLabel}
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
      <ReactionOverlay reaction={reaction ?? null} />
      <NoticeOverlay message={notice} onDismiss={onDismissNotice} />
    </>
  );
};
