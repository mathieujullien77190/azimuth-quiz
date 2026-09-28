import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DEFAULT_ORIGIN, PLAYER_COLORS } from '@/data';
import { bearingDeg, distanceKm, formatNumber, nameSkeleton, playerDisplayName, resolveOrigin } from '@/helpers';
import { getCachedClueHistory, recordClueDraw } from '@/games/clues/helpers/clueHistory';
import { useLanguage, useTranslation } from '@/i18n';
import { useClueSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { ClueId, Origin } from '@/types';

import ClueGrid from '../../components/ClueGrid';
import PlayerTabs from '@/components/PlayerTabs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import RoundProgress from '@/components/RoundProgress';
import Screen from '@/components/ui/Screen';
import { WRONG_ANSWER_PENALTY } from './constants';
import {
  normalizePlaceGuess,
  overlayTypedLetters,
  randomCluePlace,
  remainingScore,
  skeletonLetterCount,
} from './helpers';
import type { ClueGameScreenProps } from './types';

import { createStyles } from './styles';

export const ClueGameScreen = ({ onQuit }: ClueGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const { language } = useLanguage();
  const { settings } = useClueSettings();
  const players = settings.playerNames.map((name, index) => playerDisplayName(name, index));
  const playerTabs = players.map((name, index) => ({ color: PLAYER_COLORS[index], name }));
  const playerOrder = players.map((_, index) => index);
  const noneAnswered = players.map(() => false);

  // Starting point for the "heading"/"distance" clues: device position if granted, otherwise
  // Paris (same behavior as Compass). No dedicated setting for now, and the origin's
  // name is never shown here (unlike Compass), so no need for translation.
  const [origin, setOrigin] = useState<Origin>(DEFAULT_ORIGIN);
  useEffect(() => {
    let cancelled = false;
    resolveOrigin('device').then((resolved) => {
      if (!cancelled) setOrigin(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [place, setPlace] = useState(() => {
    const drawn = randomCluePlace(settings.difficulty, settings.categories, language, getCachedClueHistory() ?? {});
    recordClueDraw(drawn);
    return drawn;
  });
  const bearing = bearingDeg(origin.coordinates, place.coordinates);
  const distance = distanceKm(origin.coordinates, place.coordinates);

  const [revealedClueIds, setRevealedClueIds] = useState<ClueId[]>(() =>
    settings.startWithFirstLetter ? ['letter'] : [],
  );
  const [turnIndex, setTurnIndex] = useState(0);
  // Set once someone's found it (for the "X scores" banner) — never touched on a wrong guess, see
  // `settle`.
  const [buzzedIndex, setBuzzedIndex] = useState<number | null>(null);
  const [guessText, setGuessText] = useState('');
  // Set the moment "Valider" is pressed (before anyone's identified) to whether the typed text
  // matched — the full-screen overlay below then asks who answered, and `attributeGuess` finishes
  // the job.
  const [pendingCorrect, setPendingCorrect] = useState<boolean | null>(null);
  const [verdict, setVerdict] = useState<'correct' | 'giveUp' | null>(null);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [finished, setFinished] = useState(false);
  // Cumulative per player across the whole game (several rounds): only whoever answers sees their
  // total move, up if they find it (the round's remaining score) or down if they're wrong
  // (`WRONG_ANSWER_PENALTY`) — giving up costs nobody anything (see `settle`/`giveUp`).
  const [playerTotals, setPlayerTotals] = useState<number[]>(() => players.map(() => 0));

  const roundOver = verdict !== null;
  const isLastRound = roundNumber >= settings.rounds;
  // Round score: a countdown, not a cost accumulator (see `remainingScore`) — finding it fast
  // (few clues used) leaves a high remaining score, that's what the finder wins (see `settle`).
  const remaining = remainingScore(revealedClueIds);
  const vowelsRevealed = revealedClueIds.includes('vowels');

  // "letter" reveals in 2 clicks: 1st the first letter alone, 2nd every letter's slot with the
  // real per-word length.
  const letterStage = revealedClueIds.filter((id) => id === 'letter').length;

  // "M _ _ _" name recap above the guess input — nothing shown until "letter" has been picked at
  // least once. `lengthKnown` also gates the live-typing overlay/cap below the typed-answer input
  // (see `overlayTypedLetters`/`skeletonLetterCount`): both need the real per-word length.
  const skeletonLengthKnown = letterStage >= 2 || vowelsRevealed;
  const skeletonGroups =
    letterStage >= 1
      ? nameSkeleton(place.name, {
          groupByWord: letterStage >= 2 || vowelsRevealed,
          lengthKnown: skeletonLengthKnown,
          revealVowels: vowelsRevealed,
        })
      : [];

  // All the guards (round over, clue already revealed, emoji/flag exhausted) are enforced
  // upstream by `ClueGrid`/`ClueCard`: `onPickClue` is only provided when the round isn't over.
  const pickClue = (clueId: ClueId) => {
    setRevealedClueIds((ids) => [...ids, clueId]);
    setTurnIndex((index) => (index + 1) % players.length);
    setLastWrong(null);
  };

  const settle = (correct: boolean, index: number) => {
    // Only whoever answered sees their total move: the remaining score if they found it, a fixed
    // penalty if they were wrong (otherwise answering at random would be risk-free).
    const delta = correct ? remaining : -WRONG_ANSWER_PENALTY;
    setPlayerTotals((totals) => totals.map((total, i) => (i === index ? total + delta : total)));
    if (correct) {
      setBuzzedIndex(index);
      setVerdict('correct');
      return;
    }
    // Never reveals the answer on a miss (just "that's not it"): the round stays open so anyone
    // (including them again) can type and try.
    setLastWrong(players[index]);
    setGuessText('');
  };

  // "Valider": checks the typed text immediately (nobody's identity involved yet). Solo play has
  // only one possible answerer, so it settles right away instead of opening the full-screen "who
  // answered" overlay (`pendingCorrect`) — that overlay only makes sense once there's an actual
  // choice to make, see `attributeGuess`.
  const validateGuess = () => {
    const correct = normalizePlaceGuess(guessText) === normalizePlaceGuess(place.name);
    if (players.length === 1) {
      settle(correct, 0);
      return;
    }
    setPendingCorrect(correct);
  };

  // Resolves the overlay once a player's picked as who answered.
  const attributeGuess = (index: number) => {
    settle(pendingCorrect as boolean, index);
    setPendingCorrect(null);
  };

  // Giving up costs nobody anything (0 points): neither the gain of a right answer, nor the
  // penalty of a wrong one — just skips the round.
  const giveUp = () => {
    setVerdict('giveUp');
    setBuzzedIndex(null);
  };

  const continueRound = () => {
    if (isLastRound) {
      setFinished(true);
      return;
    }
    setRoundNumber((n) => n + 1);
    // Never null here (unlike the initial draw above): recordClueDraw already populated the
    // module-level cache synchronously for this very place pool, on mount, before any round
    // could finish and reach this point.
    const nextPlace = randomCluePlace(settings.difficulty, settings.categories, language, getCachedClueHistory()!);
    recordClueDraw(nextPlace);
    setPlace(nextPlace);
    setRevealedClueIds(settings.startWithFirstLetter ? ['letter'] : []);
    setTurnIndex(0);
    setBuzzedIndex(null);
    setGuessText('');
    setVerdict(null);
    setLastWrong(null);
  };

  const buzzedName = buzzedIndex !== null ? players[buzzedIndex] : undefined;

  if (finished) {
    // Always at least 1 player (MIN_PLAYERS = 1): `standings` is never empty. The score is
    // now a countdown you win (see `remaining`/`settle`): the HIGHEST total
    // wins, not the lowest.
    const standings = players
      .map((name, index) => ({ name, total: playerTotals[index] }))
      .sort((a, b) => b.total - a.total);
    const highest = standings[0].total;
    const winners = standings.filter((entry) => entry.total === highest).map((entry) => entry.name);

    return (
      <Screen>
        <Text style={styles.title}>{t.cluesGame.finalScoreTitle}</Text>
        {players.length > 1 && (
          <Text style={[styles.resultBanner, styles.resultCorrect]}>
            {winners.length > 1
              ? t.endScreen.tie(winners.join(` ${t.endScreen.and} `))
              : t.endScreen.winner(winners[0])}
          </Text>
        )}
        <Card>
          {standings.map((entry, index) => (
            <View key={entry.name + index} style={[styles.standingRow, index > 0 && styles.standingRowBorder]}>
              <Text style={styles.standingRank}>{index + 1}.</Text>
              <Text style={styles.standingName}>{entry.name}</Text>
              <Text style={styles.standingScore}>
                {formatNumber(entry.total)} {t.common.pts}
              </Text>
            </View>
          ))}
        </Card>
        <Button label={t.cluesGame.home} onPress={onQuit} />
      </Screen>
    );
  }

  const screen = (
    <Screen
      footer={
        <View style={styles.footerContent}>
          {!roundOver && <Text style={styles.pointsAtStake}>{t.cluesGame.pointsAtStake(formatNumber(remaining))}</Text>}
          {roundOver ? (
            <View style={styles.actions}>
              <Text style={[styles.resultBanner, verdict === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
                {/* buzzedName is always defined for 'correct' (settle requires an index). */}
                {verdict === 'correct' ? (
                  t.cluesGame.scored(buzzedName!, formatNumber(remaining))
                ) : (
                  <NoOneFoundText players={players} />
                )}
              </Text>
              <Text style={styles.revealAnswer}>
                {t.cluesGame.wasPlace} {place.name}
                <Text style={styles.revealSub}>
                  {'\n'}
                  {place.country}
                </Text>
              </Text>
              <Button label={isLastRound ? t.game.last : t.cluesGame.continueLabel} onPress={continueRound} />
            </View>
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
                            {letter !== null && (
                              <Text
                                style={
                                  skeletonLengthKnown && skeletonGroups[groupIndex][letterIndex] === null
                                    ? styles.skeletonLetterTyped
                                    : styles.skeletonLetter
                                }
                              >
                                {letter}
                              </Text>
                            )}
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
                  // Once the real length is known, block typing past it (letters only — spaces/
                  // punctuation don't count, the player may type either).
                  if (
                    skeletonLengthKnown &&
                    [...next.replace(/[^\p{L}]/gu, '')].length > skeletonLetterCount(skeletonGroups)
                  )
                    return;
                  setGuessText(next);
                }}
                onSubmitEditing={validateGuess}
                placeholder={t.cluesGame.guessPlaceholder}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={styles.guessInput}
                value={guessText}
              />
              {guessText.trim().length === 0 ? (
                <Button label={t.cluesGame.giveUp} onPress={giveUp} variant="ghost" />
              ) : (
                <Button label={t.cluesGame.submitGuess} onPress={validateGuess} />
              )}
            </View>
          )}
        </View>
      }
      header={
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onQuit}>
              <Text style={styles.quit}>{t.game.quit}</Text>
            </Pressable>
            <Text style={styles.score}>
              {players.length > 1 ? `${players[turnIndex]} · ` : ''}
              {formatNumber(playerTotals[turnIndex])} {t.common.pts}
            </Text>
          </View>
          <RoundProgress difficulties={[settings.difficulty]} roundNumber={roundNumber} totalRounds={settings.rounds} />
          <PlayerTabs
            activeIndex={roundOver ? -1 : turnIndex}
            activeLabel={t.game.playerTurn}
            answered={noneAnswered}
            order={playerOrder}
            players={playerTabs}
          />
        </View>
      }
    >
      <ClueGrid
        bearingDeg={bearing}
        distanceKm={distance}
        onPickClue={roundOver ? undefined : pickClue}
        place={place}
        revealedClueIds={revealedClueIds}
        roundOver={roundOver}
      />
    </Screen>
  );

  return (
    <>
      {screen}
      {/* Post-"Valider" step (see `validateGuess`): covers the whole screen (header included), not
          just the footer, since attributing the answer matters more right now than anything else
          on screen. */}
      {pendingCorrect !== null && (
        <View style={styles.attributeOverlay}>
          {pendingCorrect && <Text style={[styles.resultBanner, styles.resultCorrect]}>{t.cluesGame.resultOk}</Text>}
          <Text style={styles.attributePrompt}>{t.cluesGame.whoAnswered}</Text>
          <View style={styles.attributeGrid}>
            {playerOrder.map((index) => (
              <Pressable
                accessibilityRole="button"
                key={index}
                onPress={() => attributeGuess(index)}
                style={[styles.attributeButton, { borderColor: PLAYER_COLORS[index] }]}
              >
                <Text style={styles.attributeButtonText}>{players[index]}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </>
  );
};
