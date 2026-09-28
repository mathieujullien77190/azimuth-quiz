import { View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/themes';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';
import type { Point2D } from '@/types';

import {
  BORDER_STROKE_WIDTH,
  HINT_ICON_FONT_SIZE,
  HINT_LABEL_FONT_SIZE,
  NEIGHBOR_FILL_OPACITY,
  VISIBLE_STROKE_WIDTH,
} from './constants';
import { polylinePath } from './helpers';
import type { ContourBoardProps } from './types';
import { styles } from './styles';

const NO_HINT_LABELS: ContourBoardProps['hintLabels'] = [];
const NO_LINES: Point2D[][] = [];

/** One `d` attribute for several separate polylines ("M ... L ... M ... L ..."). */
const multiPath = (lines: readonly Point2D[][]): string => lines.map(polylinePath).join(' ');

/** SVG board: draws the country's fixed `outline` (the whole real border, no interaction), the
 * neighbors around it and any `hintLabels` (guess-phase hint icons/text) — purely a display, no
 * touch handling at all.
 *
 * Layering keeps every line drawn once: neighbors are filled without a stroke, then the country is
 * filled without a stroke, then its outline is stroked on top — coast (heavy) and shared borders
 * (thin) as separate paths. A border is therefore a single line, never one per country. */
export const ContourBoard = ({
  width,
  height,
  outline,
  neighborOutlines = NO_LINES,
  coastlines,
  borders = NO_LINES,
  hintLabels = NO_HINT_LABELS,
}: ContourBoardProps) => {
  const { colors, isDark, typography } = useTheme();
  const coastPath = coastlines ? multiPath(coastlines) : polylinePath(outline);
  const borderPath = multiPath(borders);

  return (
    <View style={[styles.board, { width, height }]}>
      <Svg height={height} width={width}>
        {neighborOutlines.map((ring, index) => (
          <Path d={polylinePath(ring)} fill={colors.border} fillOpacity={NEIGHBOR_FILL_OPACITY} key={index} />
        ))}
        <Path
          d={polylinePath(outline)}
          // A filled silhouette rather than a bare outline, matching the game mode's own name —
          // `surfaceHigh` by night reads as a raised panel over `ThemeBackdrop`; by day plain
          // white (`surface`) instead, since `surfaceHigh`'s pale blue there is barely
          // distinguishable from the sky backdrop right behind it.
          fill={isDark ? colors.surfaceHigh : colors.surface}
        />
        {coastPath !== '' && (
          <Path
            d={coastPath}
            fill="none"
            stroke={colors.textMuted}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={VISIBLE_STROKE_WIDTH}
          />
        )}
        {borderPath !== '' && (
          <Path
            d={borderPath}
            fill="none"
            stroke={colors.textMuted}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={BORDER_STROKE_WIDTH}
          />
        )}
        {hintLabels.map((label, index) => (
          <SvgText
            fill={colors.text}
            fontFamily={label.icon ? FLAG_FONT_FAMILY : typography.heading.fontFamily}
            fontSize={label.icon ? HINT_ICON_FONT_SIZE : HINT_LABEL_FONT_SIZE}
            fontWeight="800"
            key={index}
            textAnchor="middle"
            x={label.position.x}
            y={label.position.y}
          >
            {label.text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};
