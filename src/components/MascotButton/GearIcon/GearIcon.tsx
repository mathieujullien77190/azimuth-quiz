import { G, Path } from 'react-native-svg';

import { GEAR_ICON_CENTER, GEAR_ICON_PATH, GEAR_ICON_RADIUS } from './constants';
import type { GearIconProps } from './types';

/**
 * The settings gear (react-icons' `DiAptana`, as a react-native-svg path): drawn around the origin
 * of the SVG group it is in, `radius` px from center to teeth, turned by `angleDeg` around its own
 * center. The mascot buttons (saucer, helicopter) hang it under themselves and feed `angleDeg`
 * from `gearAngleDeg`.
 */
export const GearIcon = ({ radius, color, angleDeg }: GearIconProps) => (
  <G transform={`rotate(${angleDeg})`}>
    <Path
      d={GEAR_ICON_PATH}
      fill={color}
      transform={`scale(${radius / GEAR_ICON_RADIUS}) translate(${-GEAR_ICON_CENTER.x} ${-GEAR_ICON_CENTER.y})`}
    />
  </G>
);
