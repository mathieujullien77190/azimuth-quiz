import { Text, TextInput, View } from 'react-native';
import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import ClueGrid from '@/games/clues/components/ClueGrid';
import Button from '@/components/ui/Button';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import GameFooter from '@/components/GameFooter';
import GameHeader from '@/components/GameHeader';
import Screen from '@/components/ui/Screen';
import { WRONG_ANSWER_PENALTY } from '@/games/clues/constants';
import { skeletonLetterCount, overlayTypedLetters } from '@/games/clues/helpers/clueGame';
import type { OnlineClueGameScreenViewProps } from './types';

import { createStyles } from './OnlineClueGameScreenView.styles';

/**
 * Pur rendu, un seul `Screen` pour les 3 etats (tour actif, en attente, manche revelee) : jamais
 * de swap de composant entre eux, meme raison que le fix scroll de `OnlineGameScreenView`
 * (Boussole) — pas question de reintroduire le bug en le copiant ici.
 */
export const OnlineClueGameScreenView = ({
  onQuit,
  name,
  points,
  roomCode,
  roundNumber,
  totalRounds,
  difficulty,
  place,
  revealedClueIds,
  bearingDeg,
  distanceKm,
  skeletonGroups,
  skeletonLengthKnown,
  players,
  turnIndex,
  isMyTurn,
  turnPlayerName,
  remaining,
  verdict,
  winnerName,
  lastWrong,
  guessText,
  onChangeGuessText,
  onSubmitGuess,
  onGiveUp,
  onPickClue,
  isHost,
  isLastRound,
  onNextRound,
}: OnlineClueGameScreenViewProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const roundOver = verdict !== undefined;

  return (
    <Screen
      footer={
        <GameFooter>
          <View style={styles.footerContent}>
            {!roundOver && (
              <Text style={styles.pointsAtStake}>{t.cluesGame.pointsAtStake(formatNumber(remaining))}</Text>
            )}
            {roundOver ? (
              <View style={styles.actions}>
                <Text style={[styles.resultBanner, verdict === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
                  {verdict === 'correct' ? (
                    t.cluesGame.scored(winnerName ?? '', formatNumber(remaining))
                  ) : (
                    <NoOneFoundText players={players.map((player) => player.name)} />
                  )}
                </Text>
                <Text style={styles.revealAnswer}>
                  {t.cluesGame.wasPlace} {place.name}
                  <Text style={styles.revealSub}>
                    {'\n'}
                    {place.country}
                  </Text>
                </Text>
                {isHost ? (
                  <Button label={isLastRound ? t.game.last : t.cluesGame.continueLabel} onPress={onNextRound} />
                ) : (
                  <Text style={styles.waiting}>{t.game.waitingForOthers}</Text>
                )}
              </View>
            ) : !isMyTurn ? (
              <Text style={styles.waitingTurn}>{t.cluesGame.waitingForTurn(turnPlayerName)}</Text>
            ) : (
              <View style={styles.buzzRow}>
                {lastWrong !== null && (
                  <Text style={[styles.resultBanner, styles.resultWrong]}>
                    {t.cluesGame.missed(lastWrong, formatNumber(WRONG_ANSWER_PENALTY))}
                  </Text>
                )}
                {skeletonGroups.length > 0 && (
                  <View style={styles.skeletonRow}>
                    {(skeletonLengthKnown ? overlayTypedLetters(skeletonGroups, guessText) : skeletonGroups).map(
                      (group, groupIndex) => (
                        <View key={groupIndex} style={styles.skeletonWord}>
                          {group.map((letter, letterIndex) => (
                            <View key={letterIndex} style={styles.skeletonSlot}>
                              {letter !== null && <Text style={styles.skeletonLetter}>{letter}</Text>}
                            </View>
                          ))}
                        </View>
                      ),
                    )}
                  </View>
                )}
                <TextInput
                  autoCapitalize="words"
                  onChangeText={(next) => {
                    if (
                      skeletonLengthKnown &&
                      [...next.replace(/[^\p{L}]/gu, '')].length > skeletonLetterCount(skeletonGroups)
                    )
                      return;
                    onChangeGuessText(next);
                  }}
                  onSubmitEditing={onSubmitGuess}
                  placeholder={t.cluesGame.guessPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  style={styles.guessInput}
                  value={guessText}
                />
                {guessText.trim().length === 0 ? (
                  <Button label={t.cluesGame.giveUp} onPress={onGiveUp} variant="ghost" />
                ) : (
                  <Button label={t.cluesGame.submitGuess} onPress={onSubmitGuess} />
                )}
              </View>
            )}
          </View>
        </GameFooter>
      }
      header={
        <GameHeader
          code={roomCode}
          difficulty={difficulty}
          name={name}
          onQuit={onQuit}
          players={players}
          points={points}
          roundNumber={roundNumber}
          totalRounds={totalRounds}
          turnIndex={roundOver ? -1 : turnIndex}
        />
      }
    >
      <ClueGrid
        bearingDeg={bearingDeg}
        distanceKm={distanceKm}
        onPickClue={!roundOver && isMyTurn ? onPickClue : undefined}
        place={place}
        revealedClueIds={revealedClueIds}
        roundOver={roundOver}
      />
    </Screen>
  );
};
