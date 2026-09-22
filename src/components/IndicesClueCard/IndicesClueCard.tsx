import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { INDICES_DIFFICULTY_COLORS, INDICES_FLAG_COLOR_FIELD, INDICES_FLAG_COLORS_BY_COUNTRY, fontSize, spacing } from '@/constants';
import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Compass from '../Compass';
import EarthSection from '../EarthSection';
import { COMPASS_CLUE_SIZE, EARTH_CLUE_SIZE, POSITION_COORDS } from './constants';
import { letterCount, localTimeFor, wordCount } from './helpers';
import type { IndicesClueCardProps } from './types';

/** Indices qui passent en carte pleine largeur une fois reveles (visuel plus grand). */
const WIDE_CLUE_IDS = new Set(['bearing', 'distance']);

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    card: {
      flexBasis: '48%',
      flexGrow: 1,
      minHeight: 96,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
    },
    locked: {
      opacity: 0.7,
    },
    revealed: {
      borderColor: colors.accent,
    },
    wide: {
      flexBasis: '100%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption - 3,
    },
    difficultyDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    body: {
      height: 42,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bodyCompass: {
      height: COMPASS_CLUE_SIZE + spacing.sm,
    },
    bodyEarth: {
      height: EARTH_CLUE_SIZE + spacing.xl,
    },
    lockIcon: {
      fontSize: 17,
      opacity: 0.6,
    },
    bigEmoji: {
      fontSize: 28,
    },
    statValue: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
      textAlign: 'center',
    },
    statUnit: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption - 2,
      marginTop: 2,
      textAlign: 'center',
    },
    positionBox: {
      width: 40,
      height: 40,
      borderRadius: radius.sm - 4,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    positionDot: {
      position: 'absolute',
      width: 10,
      height: 10,
      marginLeft: -5,
      marginTop: -5,
      borderRadius: 2,
      backgroundColor: colors.accent,
    },
    flagRect: {
      minWidth: 84,
      paddingHorizontal: spacing.md,
      height: 36,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flagPercent: {
      ...typography.heading,
      fontSize: fontSize.body,
    },
    emojiSlotRow: {
      flexDirection: 'row',
      gap: spacing.xs + 2,
    },
    emojiSlotShown: {
      fontSize: 22,
    },
    emojiSlotHidden: {
      fontSize: 18,
      color: colors.textMuted,
      opacity: 0.6,
    },
  });

const revealedBody = (
  {
    clueId,
    place,
    bearingDeg,
    distanceKm,
    emojiStage,
  }: Pick<IndicesClueCardProps, 'clueId' | 'place' | 'bearingDeg' | 'distanceKm' | 'emojiStage'>,
  styles: ReturnType<typeof createStyles>,
  units: { population: string; letters: string },
  colors: Theme['colors'],
) => {
  switch (clueId) {
    case 'position': {
      const dot = POSITION_COORDS[place.positionInCountry];
      return (
        <View style={styles.positionBox}>
          <View style={[styles.positionDot, { left: `${dot.left}%`, top: `${dot.top}%` }]} />
        </View>
      );
    }
    case 'population':
      return (
        <>
          <Text style={styles.statValue}>{formatNumber(place.population)}</Text>
          <Text style={styles.statUnit}>{units.population}</Text>
        </>
      );
    case 'climate':
      return <Text style={styles.bigEmoji}>{place.climateEmoji}</Text>;
    case 'emoji': {
      const stage = emojiStage ?? 1;
      return (
        <View style={styles.emojiSlotRow}>
          {[0, 1, 2].map((i) =>
            i < stage ? (
              <Text key={i} style={styles.emojiSlotShown}>
                {place.emojis[i]}
              </Text>
            ) : (
              <Text key={i} style={styles.emojiSlotHidden}>
                ❓
              </Text>
            ),
          )}
        </View>
      );
    }
    case 'elevation':
      return (
        <>
          <Text style={styles.statValue}>{place.elevationMeters}</Text>
          <Text style={styles.statUnit}>m</Text>
        </>
      );
    case 'letterCount':
      return (
        <>
          <Text style={styles.statValue}>{letterCount(place.name)}</Text>
          <Text style={styles.statUnit}>{units.letters}</Text>
        </>
      );
    case 'wordCount':
      return <Text style={styles.statValue}>{wordCount(place.name)}</Text>;
    case 'flagColors': {
      const [main] = INDICES_FLAG_COLORS_BY_COUNTRY[place.country];
      const hex = main[INDICES_FLAG_COLOR_FIELD.HEX];
      const percent = main[INDICES_FLAG_COLOR_FIELD.PERCENT];
      // Blanc sur blanc, illisible : bordure et texte foncés dans ce cas precis, blancs sinon.
      const isWhite = main[INDICES_FLAG_COLOR_FIELD.COLOR_ID] === 'white';
      return (
        <View style={[styles.flagRect, { backgroundColor: hex, borderColor: isWhite ? colors.border : '#FFFFFF' }]}>
          <Text style={[styles.flagPercent, { color: isWhite ? colors.text : '#FFFFFF' }]}>{percent}%</Text>
        </View>
      );
    }
    case 'bearing':
      return bearingDeg !== undefined ? <Compass bearing={bearingDeg} size={COMPASS_CLUE_SIZE} /> : null;
    case 'distance':
      return distanceKm !== undefined && bearingDeg !== undefined ? (
        <EarthSection marks={[{ bearing: bearingDeg, color: colors.accent, distanceKm }]} showStraightLine={false} size={EARTH_CLUE_SIZE} />
      ) : null;
    case 'localTime':
      return <Text style={styles.statValue}>{localTimeFor(place.timezone)}</Text>;
    case 'phoneCode':
      return <Text style={styles.statValue}>{place.phoneCode}</Text>;
    case 'currency':
      return <Text style={styles.statValue}>{place.currency}</Text>;
    case 'airportCode':
      return <Text style={styles.statValue}>{place.airportCode}</Text>;
    default:
      return null;
  }
};

export const IndicesClueCard = ({
  clueId,
  label,
  place,
  state,
  cost,
  onPress,
  moreToReveal = false,
  bearingDeg,
  distanceKm,
  emojiStage,
}: IndicesClueCardProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const [revealAnim] = useState(() => new Animated.Value(state === 'revealed' ? 1 : 0));
  const pickable = (state === 'locked' || (state === 'revealed' && moreToReveal)) && onPress !== undefined;
  const wide = state === 'revealed' && WIDE_CLUE_IDS.has(clueId);

  useEffect(() => {
    if (state === 'revealed') {
      Animated.spring(revealAnim, { friction: 6, tension: 80, toValue: 1, useNativeDriver: true }).start();
    } else {
      revealAnim.setValue(0);
    }
  }, [state, revealAnim]);

  return (
    <Pressable
      accessibilityRole={pickable ? 'button' : undefined}
      disabled={!pickable}
      onPress={pickable ? onPress : undefined}
      style={[styles.card, state === 'locked' && styles.locked, state === 'revealed' && styles.revealed, wide && styles.wide]}
    >
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.difficultyDot, { backgroundColor: INDICES_DIFFICULTY_COLORS[cost] }]} />
      </View>
      <View style={[styles.body, wide && (clueId === 'bearing' ? styles.bodyCompass : styles.bodyEarth)]}>
        {state === 'revealed' ? (
          <Animated.View
            style={{
              width: '100%',
              alignItems: 'center',
              opacity: revealAnim,
              transform: [{ scale: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
            }}
          >
            {revealedBody(
              { bearingDeg, clueId, distanceKm, emojiStage, place },
              styles,
              { letters: t.indicesGame.letterUnit, population: t.indicesGame.populationUnit },
              colors,
            )}
          </Animated.View>
        ) : (
          <Text style={styles.lockIcon}>🔒</Text>
        )}
      </View>
    </Pressable>
  );
};
