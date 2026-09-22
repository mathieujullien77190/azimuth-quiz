import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/themes';

import {
  AVAILABLE_X_RATIO,
  BOTTOM_MARGIN,
  CAPTION_STRAIGHT,
  CAPTION_SURFACE,
  EARTH_RADIUS_RATIO,
  HEIGHT_RATIO,
  HORIZON_LABEL,
  PLAYER_LABEL,
  PLAYER_Y_RATIO,
} from './constants';
import { arcPath, fitZoom, markGeometry } from './helpers';
import type { EarthMark, EarthSectionProps, Point } from './types';

/**
 * La Terre vue de cote, le joueur tout en haut. Chaque reponse part du cote de son cap :
 * cap a l'ouest = a gauche, cap a l'est = a droite. Un schema = un seul mode :
 * - surface : un arc le long du cercle, de longueur = la distance ;
 * - straight : une droite qui part avec l'inclinaison choisie.
 * Des que `marks` contient une vraie reponse (isTruth), on zoome sur le haut du cercle
 * pour que les distances courtes restent lisibles.
 */
export const EarthSection = ({ size, mode, marks }: EarthSectionProps) => {
  const { colors, compass, typography } = useTheme();
  const height = size * HEIGHT_RATIO;
  const baseRadius = size * EARTH_RADIUS_RATIO;
  const player: Point = { x: size / 2, y: size * PLAYER_Y_RATIO };
  const reveal = marks.some((mark) => mark.isTruth === true);

  const geometryOf = (item: EarthMark, radius: number) => markGeometry({ item, mode, player, radius });

  let zoom = 1;
  if (reveal) {
    const offsets = marks.map((item) => {
      const { end } = geometryOf(item, baseRadius);
      return { x: end.x - player.x, y: end.y - player.y };
    });
    zoom = fitZoom(offsets, size * AVAILABLE_X_RATIO, height - player.y - BOTTOM_MARGIN);
  }

  const radius = baseRadius * zoom;
  const center: Point = { x: player.x, y: player.y + radius };
  const horizonReach = Math.min(radius * 1.15, size * 0.32);

  const mark = (item: EarthMark, key: string) => {
    const { shape, side, end, angle } = geometryOf(item, radius);
    const color = item.color;
    const opacity = item.opacity ?? 1;

    return (
      <G key={key} opacity={opacity}>
        {shape === 'arc' ? (
          <Path d={arcPath(center, radius, angle, side)} fill="none" stroke={color} strokeLinecap="round" strokeWidth={3.5} />
        ) : (
          <Line x1={player.x} y1={player.y} x2={end.x} y2={end.y} stroke={color} strokeLinecap="round" strokeWidth={3.5} />
        )}
        <Circle cx={end.x} cy={end.y} r={5.5} fill={color} stroke={colors.background} strokeWidth={2} />
        {item.isTruth === true && <Circle cx={end.x} cy={end.y} r={11} fill="none" stroke={color} strokeWidth={2} />}
      </G>
    );
  };

  return (
    <Svg accessibilityLabel={CAPTION_STRAIGHT} height={height} width={size}>
      <Defs>
        <RadialGradient id="earth" cx="50%" cy="40%" r="65%">
          <Stop offset="0%" stopColor={compass.faceInner} />
          <Stop offset="100%" stopColor={compass.faceOuter} />
        </RadialGradient>
      </Defs>

      <SvgText
        x={8}
        y={16}
        fill={colors.textMuted}
        fontFamily={typography.label.fontFamily}
        fontSize={11}
        fontWeight="700"
      >
        {(mode === 'straight' ? CAPTION_STRAIGHT : CAPTION_SURFACE).toUpperCase()}
      </SvgText>
      {zoom > 1 && (
        <SvgText
          x={size - 8}
          y={16}
          fill={colors.accent}
          fontFamily={typography.label.fontFamily}
          fontSize={11}
          fontWeight="700"
          textAnchor="end"
        >
          {`ZOOM ×${String(zoom).replace('.', ',')}`}
        </SvgText>
      )}

      <Circle cx={center.x} cy={center.y} r={radius} fill="url(#earth)" stroke={colors.border} strokeWidth={3} />
      <Circle cx={center.x} cy={center.y} r={radius * 0.28} fill="none" stroke={colors.border} strokeWidth={1} strokeDasharray="3 5" />

      {mode === 'straight' && (
        <>
          <Line
            x1={player.x - horizonReach}
            y1={player.y}
            x2={player.x + horizonReach}
            y2={player.y}
            stroke={colors.textMuted}
            strokeWidth={1.5}
            strokeDasharray="4 5"
          />
          <SvgText
            x={player.x + horizonReach}
            y={player.y - 6}
            fill={colors.textMuted}
            fontFamily={typography.body.fontFamily}
            fontSize={11}
            textAnchor="end"
          >
            {HORIZON_LABEL}
          </SvgText>
        </>
      )}

      {marks.map((item, index) => mark(item, `mark-${index}`))}

      <Circle cx={player.x} cy={player.y} r={6} fill={colors.text} stroke={colors.background} strokeWidth={2} />
      <SvgText
        x={player.x}
        y={player.y - 12}
        fill={colors.text}
        fontFamily={typography.heading.fontFamily}
        fontSize={12}
        fontWeight="800"
        textAnchor="middle"
      >
        {PLAYER_LABEL}
      </SvgText>
    </Svg>
  );
};
