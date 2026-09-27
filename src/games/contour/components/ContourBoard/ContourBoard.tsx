import { View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/themes';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';

import { HINT_ICON_FONT_SIZE, HINT_LABEL_FONT_SIZE, VISIBLE_STROKE_WIDTH } from './constants';
import { polylinePath } from './helpers';
import type { ContourBoardProps } from './types';
import { styles } from './styles';

const NO_HINT_LABELS: ContourBoardProps['hintLabels'] = [];

/** SVG board: draws the country's fixed `outline` (the whole real border, no interaction) plus
 * any `hintLabels` (guess-phase hint icons/text) — purely a display, no touch handling at all. */
export const ContourBoard = ({ width, height, outline, hintLabels = NO_HINT_LABELS }: ContourBoardProps) => {
  const { colors, isDark, typography } = useTheme();

  return (
    <View style={[styles.board, { width, height }]}>
      <Svg height={height} width={width}>
        <Path
          d={polylinePath(outline)}
          // A filled silhouette rather than a bare outline, matching the game mode's own name —
          // `surfaceHigh` by night reads as a raised panel over `ThemeBackdrop`; by day plain
          // white (`surface`) instead, since `surfaceHigh`'s pale blue there is barely
          // distinguishable from the sky backdrop right behind it.
          fill={isDark ? colors.surfaceHigh : colors.surface}
          stroke={colors.textMuted}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={VISIBLE_STROKE_WIDTH}
        />
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
