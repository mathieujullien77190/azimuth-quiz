import { G, Path } from 'react-native-svg';

import { GEAR_ICON_CENTER, GEAR_ICON_PATH, GEAR_ICON_RADIUS } from './constants';
import type { GearIconProps } from './types';

/**
 * Engrenage des reglages (`DiAptana` de react-icons, en path react-native-svg), dessine autour de l'origine du
 * groupe SVG et tourne de `angleDeg` autour de son centre.
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
