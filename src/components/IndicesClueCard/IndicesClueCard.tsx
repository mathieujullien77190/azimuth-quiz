import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSize, isCapitalPlace, spacing } from '@/constants';
import { countryCurrencyName, countryFlagColors, FLAG_COLOR_FIELD } from '@/constants/places/countries';
import { formatDistance, formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Compass from '../Compass';
import EarthSection from '../EarthSection';
import { COMPASS_CLUE_SIZE, EARTH_CLUE_SIZE, POSITION_COORDS } from './constants';
import {
  dayNightEmoji,
  elevationTierEmoji,
  firstLetterOf,
  letterCount,
  localTimeFor,
  populationTier,
  wordCount,
} from './helpers';
import type { IndicesClueCardProps } from './types';

/** Increasing diameters for the 5 dots of the population gauge (see `populationTier`). */
const POPULATION_DOT_SIZES = [6, 10, 14, 18, 22];

/** Clues that switch to a full-width card once revealed (bigger visual). */
const WIDE_CLUE_IDS = new Set(['bearing', 'distance']);

/** "1/2", "2/3"... above multi-click clues — `undefined` for single-click clues
 * (no badge in that case, see the call site in the component). */
const multiStageProgress = (
  clueId: IndicesClueCardProps['clueId'],
  place: IndicesClueCardProps['place'],
  stages: {
    emojiStage?: number;
    flagStage?: number;
    distanceStage?: number;
    elevationStage?: number;
    populationStage?: number;
    currencyStage?: number;
    localTimeStage?: number;
  },
): { stage: number; max: number } | undefined => {
  switch (clueId) {
    case 'emoji':
      return { stage: Math.min(stages.emojiStage ?? 1, 3), max: 3 };
    case 'flagColors': {
      const max = Math.min(3, (countryFlagColors(place.code) ?? []).length);
      return { stage: Math.min(stages.flagStage ?? 1, max), max };
    }
    case 'distance':
      return { stage: Math.min(stages.distanceStage ?? 1, 2), max: 2 };
    case 'elevation':
      return { stage: Math.min(stages.elevationStage ?? 1, 2), max: 2 };
    case 'population':
      return { stage: Math.min(stages.populationStage ?? 1, 2), max: 2 };
    case 'currency':
      return { stage: Math.min(stages.currencyStage ?? 1, 2), max: 2 };
    case 'localTime':
      return { stage: Math.min(stages.localTimeStage ?? 1, 2), max: 2 };
    default:
      return undefined;
  }
};

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    // No maxWidth cap: flexGrow needs to be free to stretch a card that ends up alone on its
    // row (e.g. right before a `wide` card, which forces a line break) to fill that empty space,
    // instead of leaving a half-empty row.
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
      maxWidth: '100%',
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
    stageBadge: {
      ...typography.label,
      color: colors.accent,
      fontSize: fontSize.caption - 3,
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
    bodyFlag: {
      height: 78,
    },
    lockIcon: {
      fontSize: 17,
      opacity: 0.6,
    },
    bigEmoji: {
      fontSize: 28,
    },
    populationDotRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
    },
    populationDot: {
      borderRadius: 999,
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
    flagColorList: {
      gap: spacing.xs,
      width: '100%',
      alignItems: 'center',
    },
    flagColorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    flagSwatch: {
      width: 16,
      height: 16,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    flagColorPercent: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.caption + 1,
      minWidth: 30,
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
    distanceWrap: {
      width: '100%',
      alignItems: 'center',
      position: 'relative',
    },
    distanceOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    distanceBadge: {
      minWidth: 34,
      minHeight: 26,
      paddingHorizontal: spacing.xs + 2,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    distanceBadgeText: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.caption + 1,
    },
  });

const revealedBody = (
  {
    clueId,
    place,
    bearingDeg,
    distanceKm,
    emojiStage,
    flagStage,
    distanceStage,
    elevationStage,
    populationStage,
    currencyStage,
    localTimeStage,
  }: Pick<
    IndicesClueCardProps,
    | 'clueId'
    | 'place'
    | 'bearingDeg'
    | 'distanceKm'
    | 'emojiStage'
    | 'flagStage'
    | 'distanceStage'
    | 'elevationStage'
    | 'populationStage'
    | 'currencyStage'
    | 'localTimeStage'
  >,
  styles: ReturnType<typeof createStyles>,
  units: { population: string; letters: string },
  colors: Theme['colors'],
  isCapitalLabels: { yes: string; no: string },
) => {
  switch (clueId) {
    case 'isCapital':
      return <Text style={styles.statValue}>{isCapitalPlace(place) ? isCapitalLabels.yes : isCapitalLabels.no}</Text>;
    case 'position': {
      const dot = POSITION_COORDS[place.positionInCountry];
      return (
        <View style={styles.positionBox}>
          <View style={[styles.positionDot, { left: `${dot.left}%`, top: `${dot.top}%` }]} />
        </View>
      );
    }
    case 'population': {
      const stage = populationStage ?? 1;
      if (stage < 2) {
        const tier = populationTier(place.population);
        return (
          <View style={styles.populationDotRow}>
            {POPULATION_DOT_SIZES.map((size, i) => (
              <View
                key={i}
                style={[
                  styles.populationDot,
                  { width: size, height: size, borderRadius: size / 2 },
                  i < tier ? { backgroundColor: colors.accent } : { borderColor: colors.border, borderWidth: 1.5 },
                ]}
              />
            ))}
          </View>
        );
      }
      return (
        <>
          <Text style={styles.statValue}>{formatNumber(place.population)}</Text>
          <Text style={styles.statUnit}>{units.population}</Text>
        </>
      );
    }
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
    case 'elevation': {
      const stage = elevationStage ?? 1;
      if (stage < 2) return <Text style={styles.bigEmoji}>{elevationTierEmoji(place.elevationMeters)}</Text>;
      return (
        <>
          <Text style={styles.statValue}>{place.elevationMeters}</Text>
          <Text style={styles.statUnit}>m</Text>
        </>
      );
    }
    case 'letterCount':
      return (
        <>
          <Text style={styles.statValue}>{letterCount(place.name)}</Text>
          <Text style={styles.statUnit}>{units.letters}</Text>
        </>
      );
    case 'wordCount':
      return <Text style={styles.statValue}>{wordCount(place.name)}</Text>;
    case 'firstLetter':
      return <Text style={styles.statValue}>{firstLetterOf(place.name)}</Text>;
    case 'flagColors': {
      const allColors = countryFlagColors(place.code) ?? [];
      const stage = flagStage ?? 1;
      // 1 color on the 1st click, 1 more on the 2nd, all the rest on the 3rd click (never more
      // than 3 clicks, see IndicesGameScreen): from the 3rd click on, everything is revealed at once.
      return (
        <View style={styles.flagColorList}>
          {allColors.map((row, i) => {
            const shown = stage >= 3 || i < stage;
            const hex = row[FLAG_COLOR_FIELD.HEX];
            const percent = row[FLAG_COLOR_FIELD.PERCENT];
            return (
              <View key={i} style={styles.flagColorRow}>
                <View style={[styles.flagSwatch, shown && { backgroundColor: hex }]} />
                <Text style={styles.flagColorPercent}>{shown ? `${percent}%` : '?'}</Text>
              </View>
            );
          })}
        </View>
      );
    }
    case 'bearing':
      return bearingDeg !== undefined ? <Compass bearing={bearingDeg} size={COMPASS_CLUE_SIZE} /> : null;
    case 'distance': {
      const stage = distanceStage ?? 1;
      return distanceKm !== undefined && bearingDeg !== undefined ? (
        <View style={styles.distanceWrap}>
          <EarthSection
            allowSatellite
            forceSide={1}
            marks={[{ bearing: bearingDeg, color: colors.accent, distanceKm }]}
            showStraightLine={false}
            size={EARTH_CLUE_SIZE}
          />
          <View pointerEvents="none" style={styles.distanceOverlay}>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>{stage < 2 ? '?' : formatDistance(distanceKm)}</Text>
            </View>
          </View>
        </View>
      ) : null;
    }
    case 'localTime': {
      const stage = localTimeStage ?? 1;
      if (stage < 2) return <Text style={styles.bigEmoji}>{dayNightEmoji(place.timezone)}</Text>;
      return <Text style={styles.statValue}>{localTimeFor(place.timezone)}</Text>;
    }
    case 'phoneCode':
      return <Text style={styles.statValue}>{place.phoneCode}</Text>;
    case 'currency': {
      const stage = currencyStage ?? 1;
      if (stage < 2) return <Text style={styles.statValue}>{place.currency}</Text>;
      const name = countryCurrencyName(place.code);
      return <Text style={styles.statValue}>{name ?? place.currency}</Text>;
    }
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
  onPress,
  moreToReveal = false,
  bearingDeg,
  distanceKm,
  distanceStage,
  elevationStage,
  emojiStage,
  flagStage,
  populationStage,
  currencyStage,
  localTimeStage,
}: IndicesClueCardProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const [revealAnim] = useState(() => new Animated.Value(state === 'revealed' ? 1 : 0));
  const pickable = (state === 'locked' || (state === 'revealed' && moreToReveal)) && onPress !== undefined;
  const wide = state === 'revealed' && WIDE_CLUE_IDS.has(clueId);
  const progress =
    state === 'revealed'
      ? multiStageProgress(clueId, place, {
          currencyStage,
          distanceStage,
          elevationStage,
          emojiStage,
          flagStage,
          localTimeStage,
          populationStage,
        })
      : undefined;

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
      style={[
        styles.card,
        state === 'locked' && styles.locked,
        state === 'revealed' && styles.revealed,
        wide && styles.wide,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {progress !== undefined && (
          <Text style={styles.stageBadge}>
            {progress.stage}/{progress.max}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.body,
          wide && (clueId === 'bearing' ? styles.bodyCompass : styles.bodyEarth),
          clueId === 'flagColors' && state === 'revealed' && styles.bodyFlag,
        ]}
      >
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
              {
                bearingDeg,
                clueId,
                currencyStage,
                distanceKm,
                distanceStage,
                elevationStage,
                emojiStage,
                flagStage,
                localTimeStage,
                place,
                populationStage,
              },
              styles,
              { letters: t.indicesGame.letterUnit, population: t.indicesGame.populationUnit },
              colors,
              { no: t.indicesGame.isCapitalNo, yes: t.indicesGame.isCapitalYes },
            )}
          </Animated.View>
        ) : (
          <Text style={styles.lockIcon}>🔒</Text>
        )}
      </View>
    </Pressable>
  );
};
