import { Text, TextInput, View } from 'react-native';
import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import ClueGrid from '@/games/clues/components/ClueGrid';
import Button from '@/components/ui/Button';
import NoticeOverlay from '@/components/NoticeOverlay';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import GameFooter from '@/components/GameFooter';
import GameHeader from '@/components/GameHeader';
import Screen from '@/components/ui/Screen';
import { WRONG_ANSWER_PENALTY } from '@/games/clues/constants';
import { skeletonLetterCount, overlayTypedLetters } from '@/games/clues/helpers/clueGame';
import { HYPHEN_SLOT } from '@/games/clues/helpers/clueSkeleton';
import type { OnlineClueGameScreenViewProps } from './types';

import { createStyles } from './OnlineClueGameScreenView.styles';

/**
 * Pur rendu, un seul `Screen` pour les 3 etats (tour actif, en attente, manche revelee) ; un indice touche hors de son tour ouvre `notice` : jamais
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
  remaining,
  verdict,
  winnerName,
  iWon,
  lastWrong,
  guessText,
  onChangeGuessText,
  onSubmitGuess,
  onGiveUp,
  onPickClue,
  notice,
  onDismissNotice,
  typedByActivePlayer,
  isHost,
  isLastRound,
  onNextRound,
}: OnlineClueGameScreenViewProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const roundOver = verdict !== undefined;
  // What the letter clue's skeleton (boxes, or the plain line below when the shape isn't known
  // yet) overlays: the turn-holder's own draft while typing it, the mirrored `typing` text for
  // everyone else — same value, same live update, whoever is looking at it.
  const previewText = isMyTurn ? guessText : typedByActivePlayer;

  return (
    <Screen
      footer={
        <GameFooter>
          <View style={styles.footerContent}>
            {!roundOver && (
              <Text style={styles.pointsAtStake}>{t.cluesGame.pointsAtStake(formatNumber(remaining))}</Text>
            )}
            {!roundOver && skeletonGroups.length > 0 && (
              <View style={styles.skeletonRow}>
                {overlayTypedLetters(skeletonGroups, previewText).map((group, groupIndex) => (
                  <View key={groupIndex} style={styles.skeletonWord}>
                    {group.map((letter, letterIndex) => (
                      <View key={letterIndex} style={letter === HYPHEN_SLOT ? styles.skeletonHyphen : styles.skeletonSlot}>
                        {letter !== null && <Text style={styles.skeletonLetter}>{letter}</Text>}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
            {/* No letter clue picked at all yet: no shape to box the typed word into, but it's
                still worth showing, live, to everyone — self included. */}
            {!roundOver && skeletonGroups.length === 0 && previewText !== '' && (
              <Text style={styles.typingPreview}>{previewText}</Text>
            )}
            {roundOver ? (
              <View style={styles.actions}>
                <Text style={[styles.resultBanner, verdict === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
                  {verdict === 'correct' ? (
                    iWon ? (
                      t.cluesGame.youScored(formatNumber(remaining))
                    ) : (
                      t.cluesGame.scored(winnerName ?? '', formatNumber(remaining))
                    )
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
                {isHost && (
                  <Button label={isLastRound ? t.game.last : t.cluesGame.continueLabel} onPress={onNextRound} />
                )}
              </View>
            ) : isMyTurn ? (
              <View style={styles.buzzRow}>
                {lastWrong !== null && (
                  <Text style={[styles.resultBanner, styles.resultWrong]}>
                    {t.cluesGame.missed(lastWrong, formatNumber(WRONG_ANSWER_PENALTY))}
                  </Text>
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
                {guessText.trim().length > 0 ? (
                  <Button label={t.cluesGame.submitGuess} onPress={onSubmitGuess} />
                ) : (
                  // Giving up is a host call (below), not the turn-holder's own — even when it's
                  // the host's own turn, it goes through the very same button, not a duplicate.
                  isHost && <Button label={t.cluesGame.giveUp} onPress={onGiveUp} variant="ghost" />
                )}
              </View>
            ) : (
              // Not this device's turn: only the host can still cut the round short from here.
              isHost && <Button label={t.cluesGame.giveUp} onPress={onGiveUp} variant="ghost" />
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
        onPickClue={roundOver ? undefined : onPickClue}
        place={place}
        revealedClueIds={revealedClueIds}
        roundOver={roundOver}
      />
      <NoticeOverlay message={notice} onDismiss={onDismissNotice} />
    </Screen>
  );
};
