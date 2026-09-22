import { formatBearing, formatInclination } from '@/helpers';
import type { ThemeColors } from '@/types';

/** Couleur de feedback selon la part de points obtenue. */
export const feedbackColor = (colors: ThemeColors, points: number, maxPoints: number): string => {
  const ratio = maxPoints > 0 ? points / maxPoints : 0;
  if (ratio >= 0.7) return colors.success;
  if (ratio >= 0.35) return colors.accent;
  return colors.danger;
};

/** "NE · 48°", suivi de l'inclinaison en mode ligne droite. */
export const directionText = (bearing: number, inclination: number, straightLine: boolean): string =>
  straightLine ? `${formatBearing(bearing)} · ${formatInclination(inclination)}` : formatBearing(bearing);
