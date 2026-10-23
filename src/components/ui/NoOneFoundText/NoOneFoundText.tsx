import { Text } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import type { NoOneFoundTextProps } from './types';

import { createStyles } from './styles';

/**
 * Ligne « personne n'a trouve » pour une manche non resolue (abandon dans Indices) : en solo nomme l'unique
 * joueur (`t.common.soloNotFound`) au lieu du « personne » generique (`t.common.noOneFound`). Toujours en
 * rouge danger, ou qu'elle soit imbriquee, comme une mauvaise reponse.
 */
export const NoOneFoundText = ({ players }: NoOneFoundTextProps) => {
  const t = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <Text style={styles.text}>{players.length === 1 ? t.common.soloNotFound(players[0]) : t.common.noOneFound}</Text>
  );
};
