import { ActivityIndicator } from 'react-native';

import { useTheme } from '@/themes';

import type { SpinnerProps } from './types';

/**
 * Petit indicateur qui tourne (« on attend ») : partage par le splash de chargement et le resultat de manche en
 * attente de la reponse d'un joueur.
 */
export const Spinner = ({ size = 'small', color }: SpinnerProps) => {
  const { colors } = useTheme();

  return <ActivityIndicator color={color ?? colors.accent} size={size} />;
};
