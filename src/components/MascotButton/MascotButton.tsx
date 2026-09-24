import { useTheme } from '@/themes';

import HelicopterButton from '../HelicopterButton';
import UfoButton from '../UfoButton';
import type { MascotButtonProps } from './types';

/**
 * Bouton d'acces aux reglages : une soucoupe volante la nuit (ciel etoile), un helicoptere le
 * jour (ciel bleu) — voir `theme.isDark`. Meme comportement de roaming/capture des deux cotes
 * (voir HomeScreen), seul le dessin change.
 */
export const MascotButton = (props: MascotButtonProps) => {
  const { isDark } = useTheme();
  return isDark ? <UfoButton {...props} /> : <HelicopterButton {...props} />;
};
