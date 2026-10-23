import { Text, TextInput, View } from 'react-native';
import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import ClueGrid from '@/games/clues/components/ClueGrid';
import Button from '@/components/ui/Button';
import NoticeOverlay from '@/components/NoticeOverlay';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import GameFooter from '@/components/GameFooter';
import ReactionOverlay from '@/components/ReactionOverlay';
import TypedAnswer from '@/components/TypedAnswer';
import GameHeader from '@/components/GameHeader';
import Screen from '@/components/ui/Screen';
import { WRONG_ANSWER_PENALTY } from '@/games/clues/constants';
import { skeletonLetterCount, overlayTypedLetters, typedSkeleton } from '@/games/clues/helpers/clueGame';
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
  reaction,
  onReact,
  roundNumber,
  totalRounds,
  difficulty,
  place,
  revealedClueIds,
  bearingDeg,
  distanceKm,
  origin,
  skeletonGroups,
  skeletonLengthKnown,
  players,
  turnIndex,
  isMyTurn,
  guessedThisTurn,
  remaining,
  verdict,
  winnerName,
  iWon,
  wrongGuesserName,
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
  // Ce que le squelette de `letter` superpose : le brouillon du detenteur, le texte `typing` pour les autres.
  const previewText = isMyTurn ? guessText : typedByActivePlayer;
  // Sous le palier 2 (`skeletonLengthKnown`) la forme reelle est inconnue : encadrer `skeletonGroups` figerait l'affichage sur la 1re lettre.
  // `typedSkeleton` encadre la saisie elle-meme, sans rien reveler ; la 1re lettre de l'indice n'est qu'un depart.
  const displayGroups = skeletonLengthKnown
    ? overlayTypedLetters(skeletonGroups, previewText)
    : previewText !== ''
      ? typedSkeleton(previewText)
      : skeletonGroups;

  return (
    <Screen
      overlay={<ReactionOverlay reaction={reaction ?? null} />}
      footer={
        <GameFooter onReact={onReact}>
          <View style={styles.footerContent}>
            {!roundOver && (
              <Text style={styles.pointsAtStake}>{t.cluesGame.pointsAtStake(formatNumber(remaining))}</Text>
            )}
            {!roundOver && <TypedAnswer groups={displayGroups} />}
            {/* Qui vient de se tromper, visible de toute la room (voir `wrongGuesserName` dans le hook). */}
            {!roundOver && wrongGuesserName !== null && (
              <Text style={[styles.resultBanner, styles.resultWrong]}>
                {t.cluesGame.missed(wrongGuesserName, formatNumber(WRONG_ANSWER_PENALTY))}
              </Text>
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
                {guessedThisTurn ? (
                  // Deja propose ce tour : plus de champ ni "Valider", seul un indice reste (l'hote peut encore couper la manche).
                  <>
                    <Text style={styles.guessedNote}>{t.game.alreadyGuessed}</Text>
                    {isHost && <Button label={t.cluesGame.giveUp} onPress={onGiveUp} variant="ghost" />}
                  </>
                ) : (
                  <>
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
                      // Abandonner est un choix de l'hote, meme a son propre tour : un seul bouton, pas de doublon.
                      isHost && <Button label={t.cluesGame.giveUp} onPress={onGiveUp} variant="ghost" />
                    )}
                  </>
                )}
              </View>
            ) : (
              // Pas le tour de cet appareil : seul l'hote peut encore couper la manche.
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
        origin={origin}
        onPickClue={roundOver ? undefined : onPickClue}
        place={place}
        revealedClueIds={revealedClueIds}
        roundOver={roundOver}
      />
      <NoticeOverlay message={notice} onDismiss={onDismissNotice} />
    </Screen>
  );
};
