import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DEFAULT_ORIGIN, INDICES_CLUE_COSTS, INDICES_CLUE_ORDER, PLAYER_COLORS, fontSize, spacing } from '@/constants';
import { bearingDeg, distanceKm, formatNumber, playerDisplayName, resolveOrigin } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useIndicesSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { IndicesClueId, Origin, Theme } from '@/types';

import IndicesClueCard from '../IndicesClueCard';
import PlayerTabs from '../PlayerTabs';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Screen from '../ui/Screen';
import { normalizePlaceGuess, randomIndicesPlace, scoreForRevealed } from './helpers';
import type { IndicesGameScreenProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    header: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    quit: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body,
    },
    score: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    clueGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    buzzPanel: {
      gap: spacing.sm + 2,
    },
    buzzTitle: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    verdictRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    verdictBtn: {
      flex: 1,
      paddingVertical: spacing.sm + 3,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
    },
    verdictLabelCorrect: {
      ...typography.heading,
      color: colors.success,
      fontSize: fontSize.body,
    },
    verdictLabelWrong: {
      ...typography.heading,
      color: colors.danger,
      fontSize: fontSize.body,
    },
    resultBanner: {
      ...typography.heading,
      textAlign: 'center',
      fontSize: fontSize.caption + 1,
    },
    resultCorrect: {
      color: colors.success,
    },
    resultWrong: {
      color: colors.danger,
    },
    revealAnswer: {
      ...typography.heading,
      textAlign: 'center',
      color: colors.text,
      fontSize: fontSize.body,
    },
    revealSub: {
      ...typography.body,
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: fontSize.caption,
      marginTop: 2,
    },
    actions: {
      gap: spacing.sm,
    },
    buzzRow: {
      gap: spacing.sm,
    },
    guessInput: {
      ...typography.heading,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
  });

export const IndicesGameScreen = ({ onQuit }: IndicesGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const { settings } = useIndicesSettings();
  const players = settings.playerNames.map((name, index) => playerDisplayName(name, index));
  const playerTabs = players.map((name, index) => ({ color: PLAYER_COLORS[index], name }));
  const playerOrder = players.map((_, index) => index);
  const noneAnswered = players.map(() => false);

  // Point de depart pour les indices "cap"/"distance" : position de l'appareil si accordee, sinon
  // Paris (meme comportement que Boussole). Pas de reglage dedie pour l'instant, et le nom de
  // l'origine n'est jamais affiche ici (contrairement a Boussole), donc pas besoin de traduction.
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

  const [place, setPlace] = useState(() => randomIndicesPlace(settings.difficulty));
  const bearing = bearingDeg(origin.coordinates, place.coordinates);
  const distance = distanceKm(origin.coordinates, place.coordinates);

  const [revealedClueIds, setRevealedClueIds] = useState<IndicesClueId[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [buzzOpen, setBuzzOpen] = useState(false);
  const [buzzedIndex, setBuzzedIndex] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [guessText, setGuessText] = useState('');
  const [verdict, setVerdict] = useState<'correct' | 'wrong' | 'giveUp' | null>(null);

  const roundOver = verdict !== null;
  // Score qui MONTE a chaque indice choisi (plus il est facile, plus il coute cher) : c'est celui
  // qui a le score le plus BAS qui gagne, pas le plus haut.
  const score = scoreForRevealed(revealedClueIds);
  // Une mauvaise reponse coute 1 point de plus ; abandonner ("Je ne sais pas") garde le score deja
  // accumule tel quel, sans penalite ni remise a zero supplementaire.
  const finalScore = verdict === 'wrong' ? score + 1 : score;
  const displayScore = roundOver ? finalScore : score;

  // L'emoji se devoile en 3 fois (place.emojis est un triplet) : chaque clic supplementaire sur la
  // carte deja revelee compte comme un nouvel indice choisi (cout + tour), jusqu'a epuisement.
  const emojiStage = revealedClueIds.filter((id) => id === 'emoji').length;

  const pickClue = (clueId: IndicesClueId) => {
    if (roundOver) return;
    if (clueId === 'emoji' ? emojiStage >= 3 : revealedClueIds.includes(clueId)) return;
    setRevealedClueIds((ids) => [...ids, clueId]);
    setTurnIndex((index) => (index + 1) % players.length);
  };

  const openBuzz = () => {
    if (roundOver) return;
    setBuzzOpen(true);
    setVerified(false);
    setGuessText('');
    // "Celui qui a choisi" : forcement le joueur dont c'est le tour, pas de choix a faire.
    setBuzzedIndex(settings.buzzerMode === 'turnPlayer' ? turnIndex : null);
  };

  const verify = () => setVerified(true);

  const settle = (correct: boolean) => {
    setVerdict(correct ? 'correct' : 'wrong');
    setBuzzOpen(false);
  };

  const submitGuess = () => {
    if (buzzedIndex === null) return;
    settle(normalizePlaceGuess(guessText) === normalizePlaceGuess(place.name));
  };

  const giveUp = () => {
    if (roundOver) return;
    setVerdict('giveUp');
    setBuzzOpen(false);
    setBuzzedIndex(null);
  };

  const restart = () => {
    setPlace(randomIndicesPlace(settings.difficulty));
    setRevealedClueIds([]);
    setTurnIndex(0);
    setBuzzOpen(false);
    setBuzzedIndex(null);
    setVerified(false);
    setGuessText('');
    setVerdict(null);
  };

  const buzzedName = buzzedIndex !== null ? players[buzzedIndex] : undefined;

  return (
    <Screen
      footer={
        !roundOver &&
        (buzzOpen ? (
          <View style={styles.buzzPanel}>
            <Text style={styles.buzzTitle}>
              {buzzedName === undefined
                ? t.indicesGame.whoBuzzes
                : settings.answerMethod === 'typed'
                  ? t.indicesGame.buzzedPromptTyped(buzzedName)
                  : t.indicesGame.buzzedPrompt(buzzedName)}
            </Text>
            {settings.buzzerMode === 'anyone' && (
              <PlayerTabs
                activeIndex={buzzedIndex ?? -1}
                allowRevision
                answered={noneAnswered}
                onSelect={setBuzzedIndex}
                order={playerOrder}
                players={playerTabs}
              />
            )}
            {buzzedIndex !== null && settings.answerMethod === 'typed' && (
              <>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setGuessText}
                  onSubmitEditing={submitGuess}
                  placeholder={t.indicesGame.guessPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  style={styles.guessInput}
                  value={guessText}
                />
                <Button disabled={guessText.trim().length === 0} label={t.indicesGame.submitGuess} onPress={submitGuess} />
              </>
            )}
            {buzzedIndex !== null && settings.answerMethod === 'spoken' && !verified && (
              <Button label={t.indicesGame.verify} onPress={verify} />
            )}
            {verified && settings.answerMethod === 'spoken' && (
              <>
                <Text style={styles.revealAnswer}>
                  {t.indicesGame.wasPlace} {place.name}
                  <Text style={styles.revealSub}>{'\n'}{place.country}</Text>
                </Text>
                <View style={styles.verdictRow}>
                  <Pressable accessibilityRole="button" onPress={() => settle(true)} style={styles.verdictBtn}>
                    <Text style={styles.verdictLabelCorrect}>{t.indicesGame.correct}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => settle(false)} style={styles.verdictBtn}>
                    <Text style={styles.verdictLabelWrong}>{t.indicesGame.wrong}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.buzzRow}>
            <Button label={t.indicesGame.buzz} onPress={openBuzz} variant="ghost" />
            <Button label={t.indicesGame.giveUp} onPress={giveUp} variant="ghost" />
          </View>
        ))
      }
      header={
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onQuit}>
              <Text style={styles.quit}>{t.game.quit}</Text>
            </Pressable>
            <Text style={styles.score}>
              {formatNumber(displayScore)} {t.common.pts}
            </Text>
          </View>
          <PlayerTabs
            activeIndex={roundOver ? -1 : turnIndex}
            allowRevision
            answered={noneAnswered}
            onSelect={() => {}}
            order={playerOrder}
            players={playerTabs}
          />
        </View>
      }
    >
      <Text style={styles.hint}>{roundOver ? t.indicesGame.roundOver : t.indicesGame.turnHint(players[turnIndex])}</Text>

      <Card>
        <View style={styles.clueGrid}>
          {INDICES_CLUE_ORDER.map((clueId) => {
            // A la revelation, tout s'affiche, meme les indices jamais choisis pendant la manche.
            const revealed = roundOver || revealedClueIds.includes(clueId);
            const isEmoji = clueId === 'emoji';
            return (
              <IndicesClueCard
                bearingDeg={bearing}
                clueId={clueId}
                cost={INDICES_CLUE_COSTS[clueId]}
                distanceKm={distance}
                emojiStage={isEmoji ? (roundOver ? 3 : emojiStage) : undefined}
                key={clueId}
                label={t.indicesGame.clues[clueId]}
                moreToReveal={isEmoji && !roundOver && emojiStage < 3}
                onPress={roundOver ? undefined : () => pickClue(clueId)}
                place={place}
                state={revealed ? 'revealed' : 'locked'}
              />
            );
          })}
        </View>
      </Card>

      {roundOver && (
        <>
          <Text style={[styles.resultBanner, verdict === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
            {verdict === 'correct'
              ? t.indicesGame.scored(buzzedName ?? '', formatNumber(finalScore))
              : verdict === 'wrong'
                ? t.indicesGame.missed(buzzedName ?? '', formatNumber(finalScore))
                : t.indicesGame.noOneFound(formatNumber(finalScore))}
          </Text>
          <Text style={styles.revealAnswer}>
            {t.indicesGame.wasPlace} {place.name}
            <Text style={styles.revealSub}>{'\n'}{place.country}</Text>
          </Text>
          <View style={styles.actions}>
            <Button label={t.indicesGame.replay} onPress={restart} />
            <Button label={t.indicesGame.home} onPress={onQuit} variant="ghost" />
          </View>
        </>
      )}
    </Screen>
  );
};
