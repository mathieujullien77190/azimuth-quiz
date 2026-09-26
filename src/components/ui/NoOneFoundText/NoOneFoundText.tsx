import { StyleSheet, Text } from 'react-native';

import { fontSize } from '@/constants';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import type { NoOneFoundTextProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    text: {
      ...typography.heading,
      color: colors.danger,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
  });

/**
 * Shared "nobody found it" line for a round nobody solved (Indices' give-up, Contour's hint-tier-4
 * confirm): names the one player in solo play (`t.common.soloNotFound`) instead of the generic
 * "nobody" (`t.common.noOneFound`) — there's no one else it could have been. Always the same
 * red/danger look regardless of where it's nested, same as an actual wrong guess.
 */
const NoOneFoundText = ({ players }: NoOneFoundTextProps) => {
  const t = useTranslation();
  const styles = useThemedStyles(createStyles);
  return <Text style={styles.text}>{players.length === 1 ? t.common.soloNotFound(players[0]) : t.common.noOneFound}</Text>;
};

export default NoOneFoundText;
