import { Text } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import type { NoOneFoundTextProps } from './types';

import { createStyles } from './styles';

/**
 * Shared "nobody found it" line for a round nobody solved (Clues' give-up, Contour's hint-tier-4
 * confirm): names the one player in solo play (`t.common.soloNotFound`) instead of the generic
 * "nobody" (`t.common.noOneFound`) — there's no one else it could have been. Always the same
 * red/danger look regardless of where it's nested, same as an actual wrong guess.
 */
export const NoOneFoundText = ({ players }: NoOneFoundTextProps) => {
  const t = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <Text style={styles.text}>{players.length === 1 ? t.common.soloNotFound(players[0]) : t.common.noOneFound}</Text>
  );
};
