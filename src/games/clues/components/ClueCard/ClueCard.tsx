import { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { DIFFICULTIES, difficultyEmoji } from '@/data';
import { flagEmoji } from '@/helpers/flagEmoji';
import { formatDistance, formatNumber, nameSkeleton } from '@/helpers';
import { charadeFor, charadeLines, charadeMaxStage } from '@/games/clues/helpers/charade';
import { personalityFor } from '@/games/clues/helpers/personality';
import { wordplayFor } from '@/games/clues/helpers/wordplay';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Compass from '@/components/Compass';
import EarthSection from '@/components/EarthSection';
import Globe3D from '@/components/Globe3D';
import { COMPASS_CLUE_SIZE, EARTH_CLUE_SIZE, GLOBE_CLUE_SIZE, POSITION_COORDS } from './constants';
import {
  charadeBodyHeight,
  dayNightEmoji,
  elevationTierEmoji,
  localTimeFor,
  populationTier,
  vowelsOf,
} from './helpers';
import type { ClueCardProps } from './types';
import { createStyles } from './styles';

/** Increasing diameters for the 5 dots of the population gauge (see `populationTier`). */
const POPULATION_DOT_SIZES = [6, 10, 14, 18, 22];

/** Clues that always span the full width of the grid, locked or revealed (bigger visual, and
 * avoids relying on react-native-web's more forgiving flexbox to fit the compass/Earth). */
const WIDE_CLUE_IDS = new Set(['bearing', 'distance', 'globe', 'charade', 'wordplay']);

/** "1/2", "2/3"... above multi-click clues — `undefined` for single-click clues
 * (no badge in that case, see the call site in the component). */
const multiStageProgress = (
  clueId: ClueCardProps['clueId'],
  place: ClueCardProps['place'],
  stages: {
    emojiStage?: number;
    flagStage?: number;
    distanceStage?: number;
    globeStage?: number;
    elevationStage?: number;
    populationStage?: number;
    currencyStage?: number;
    localTimeStage?: number;
    letterStage?: number;
    charadeStage?: number;
  },
): { stage: number; max: number } | undefined => {
  switch (clueId) {
    case 'emoji':
      return { stage: Math.min(stages.emojiStage ?? 1, 3), max: 3 };
    case 'flagColors':
      // Always exactly 3, regardless of how many colors the flag actually has: 1 color, then
      // every color, then the actual flag.
      return { stage: Math.min(stages.flagStage ?? 1, 3), max: 3 };
    case 'distance':
      return { stage: Math.min(stages.distanceStage ?? 1, 2), max: 2 };
    case 'globe':
      return { stage: Math.min(stages.globeStage ?? 1, 2), max: 2 };
    case 'elevation':
      return { stage: Math.min(stages.elevationStage ?? 1, 2), max: 2 };
    case 'population':
      return { stage: Math.min(stages.populationStage ?? 1, 2), max: 2 };
    case 'currency':
      return { stage: Math.min(stages.currencyStage ?? 1, 2), max: 2 };
    case 'localTime':
      return { stage: Math.min(stages.localTimeStage ?? 1, 2), max: 2 };
    case 'letter':
      return { stage: Math.min(stages.letterStage ?? 1, 2), max: 2 };
    case 'charade': {
      const max = charadeMaxStage(charadeFor(place));
      return { stage: Math.min(stages.charadeStage ?? 1, max), max };
    }
    default:
      return undefined;
  }
};

const revealedBody = (
  {
    clueId,
    place,
    bearingDeg,
    distanceKm,
    origin,
    emojiStage,
    flagStage,
    distanceStage,
    globeStage,
    elevationStage,
    populationStage,
    currencyStage,
    localTimeStage,
    letterStage,
    charadeStage,
  }: Pick<
    ClueCardProps,
    | 'clueId'
    | 'place'
    | 'bearingDeg'
    | 'distanceKm'
    | 'origin'
    | 'emojiStage'
    | 'flagStage'
    | 'distanceStage'
    | 'globeStage'
    | 'elevationStage'
    | 'populationStage'
    | 'currencyStage'
    | 'localTimeStage'
    | 'letterStage'
    | 'charadeStage'
  >,
  styles: ReturnType<typeof createStyles>,
  units: { population: string },
  colors: Theme['colors'],
  isCapitalLabels: { yes: string; no: string },
) => {
  switch (clueId) {
    case 'isCapital':
      return (
        <Text style={styles.statValue}>{place.category === 'capital' ? isCapitalLabels.yes : isCapitalLabels.no}</Text>
      );
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
    case 'letter': {
      const stage = letterStage ?? 1;
      const groups = nameSkeleton(place.name, { groupByWord: stage >= 2, lengthKnown: stage >= 2 });
      return (
        <View style={styles.letterRow}>
          {groups.map((group, groupIndex) => (
            <Text key={groupIndex} style={styles.letterValue}>
              {group.map((slot) => slot ?? '_')}
            </Text>
          ))}
        </View>
      );
    }
    case 'charade': {
      const entry = charadeFor(place);
      const { lines } = charadeLines(entry, charadeStage ?? 1);
      return (
        <View style={styles.charadeLines}>
          {lines.map((line, index) => (
            <Text key={index} style={styles.charadeLine}>
              <Text style={styles.charadeLabel}>{line.label} est </Text>
              {line.text}
            </Text>
          ))}
        </View>
      );
    }
    case 'wordplay': {
      const entry = wordplayFor(place);
      return entry === null ? null : <Text style={styles.wordplaySentence}>{entry.sentence}</Text>;
    }
    case 'personality': {
      const personality = personalityFor(place);
      return personality === null ? null : (
        <View>
          <Text style={styles.personalityName}>{personality.name}</Text>
          {personality.description !== null && <Text style={styles.statUnit}>{personality.description}</Text>}
        </View>
      );
    }
    case 'vowels':
      return <Text style={styles.statValue}>{vowelsOf(place.name)}</Text>;
    case 'flagColors': {
      const allColors = place.flagColors;
      const stage = flagStage ?? 1;
      // 1st click: one color. 2nd click: every color, however many the flag actually has. 3rd
      // click: swaps the swatches for the actual flag (see CluesGameScreen).
      if (stage >= 3) return <Text style={styles.flagEmoji}>{flagEmoji(place.code)}</Text>;
      const visibleColors = stage >= 2 ? allColors : allColors.slice(0, 1);
      return (
        <View style={styles.flagColorList}>
          {visibleColors.map(({ hex, percent }, i) => {
            return (
              <View key={i} style={styles.flagColorRow}>
                <View style={[styles.flagSwatch, { backgroundColor: hex }]} />
                <Text style={styles.flagColorPercent}>{percent}%</Text>
              </View>
            );
          })}
        </View>
      );
    }
    case 'bearing':
      return bearingDeg !== undefined ? (
        <Compass needles={[{ bearing: bearingDeg, color: colors.accent }]} size={COMPASS_CLUE_SIZE} />
      ) : null;
    case 'distance': {
      const stage = distanceStage ?? 1;
      return distanceKm !== undefined && bearingDeg !== undefined ? (
        <View style={styles.distanceWrap}>
          <EarthSection
            allowSatellite
            forceSide={1}
            marks={[{ bearing: bearingDeg, color: colors.accent, distanceKm }]}
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
    case 'globe':
      // The answer on a globe, turned with a finger: the starting point, and the place as a circled point (no route).
      return origin !== undefined && bearingDeg !== undefined && distanceKm !== undefined ? (
        <Globe3D
          equator
          greenwich
          land={(globeStage ?? 1) >= 2}
          marks={[{ bearing: bearingDeg, color: colors.accent, distanceKm, isTruth: true }]}
          origin={origin}
          size={GLOBE_CLUE_SIZE}
        />
      ) : null;
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
      return <Text style={styles.statValue}>{place.currencyName || place.currency}</Text>;
    }
    case 'airportCode':
      return <Text style={styles.statValue}>{place.airportCode}</Text>;
    default:
      return null;
  }
};

export const ClueCard = ({
  clueId,
  label,
  place,
  state,
  onPress,
  moreToReveal = false,
  bearingDeg,
  distanceKm,
  origin,
  distanceStage,
  globeStage,
  elevationStage,
  emojiStage,
  flagStage,
  populationStage,
  currencyStage,
  localTimeStage,
  letterStage,
  charadeStage,
}: ClueCardProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const t = useTranslation();
  const [revealAnim] = useState(() => new Animated.Value(state === 'revealed' ? 1 : 0));
  const pickable = (state === 'locked' || (state === 'revealed' && moreToReveal)) && onPress !== undefined;
  const wide = WIDE_CLUE_IDS.has(clueId);
  const progress =
    state === 'revealed'
      ? multiStageProgress(clueId, place, {
          charadeStage,
          currencyStage,
          distanceStage,
          elevationStage,
          globeStage,
          emojiStage,
          flagStage,
          letterStage,
          localTimeStage,
          populationStage,
        })
      : undefined;
  // Plain colored dot (🟢/🟠/🔴), how tricky THIS pun is — never gates whether the clue is
  // offered, purely informational, shown locked (next to the padlock) and revealed (see
  // `wordplayFor`'s own doc comment).
  const wordplayEntry = clueId === 'wordplay' ? wordplayFor(place) : null;
  const wordplayDifficultyEmoji =
    wordplayEntry === null
      ? undefined
      : difficultyEmoji(
          DIFFICULTIES.find((entry) => entry.id === wordplayEntry.difficulty)!,
          isDark,
        );

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
        {wordplayDifficultyEmoji !== undefined && (
          <Text style={styles.wordplayDifficulty}>{wordplayDifficultyEmoji}</Text>
        )}
        {progress !== undefined && (
          <View accessibilityLabel={`${progress.stage}/${progress.max}`} style={styles.stageDots}>
            {Array.from({ length: progress.max }, (_, i) => (
              <View key={i} style={[styles.stageDot, i < progress.stage && styles.stageDotFilled]} />
            ))}
          </View>
        )}
      </View>
      <View
        style={[
          styles.body,
          wide && clueId === 'bearing' && styles.bodyCompass,
          wide && clueId === 'distance' && styles.bodyEarth,
          wide && clueId === 'globe' && styles.bodyGlobe,
          clueId === 'flagColors' && state === 'revealed' && styles.bodyFlag,
          clueId === 'charade' && styles.bodyCharade,
          clueId === 'charade' &&
            state === 'revealed' && { minHeight: charadeBodyHeight(charadeMaxStage(charadeFor(place))) },
          clueId === 'wordplay' && styles.bodyWordplay,
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
                origin,
                distanceStage,
                globeStage,
                elevationStage,
                emojiStage,
                flagStage,
                letterStage,
                localTimeStage,
                place,
                populationStage,
                charadeStage,
              },
              styles,
              { population: t.cluesGame.populationUnit },
              colors,
              { no: t.cluesGame.isCapitalNo, yes: t.cluesGame.isCapitalYes },
            )}
          </Animated.View>
        ) : (
          <Text style={styles.lockIcon}>🔒</Text>
        )}
      </View>
    </Pressable>
  );
};
