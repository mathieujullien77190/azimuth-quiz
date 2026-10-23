import { Switch, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '@/themes';

import { DAY_TRACK_ON_COLOR, NIGHT_THUMB_ON_COLOR } from './constants';
import type { ToggleProps } from './types';

import { createStyles } from './styles';

// `disabled` grise la ligne et la signale a l'accessibilite, mais le Switch reste interactif pour que
// `onValueChange` de l'appelant reagisse (ex. expliquer pourquoi) au lieu que React Native avale le toucher.
export const Toggle = ({ label, description, value, onValueChange, disabled = false }: ToggleProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const thumbOnColor = isDark ? NIGHT_THUMB_ON_COLOR : colors.accent;
  const trackOnColor = isDark ? colors.accent : DAY_TRACK_ON_COLOR;

  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description !== undefined && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        onValueChange={onValueChange}
        thumbColor={value ? thumbOnColor : colors.textMuted}
        // react-native-web ignore `thumbColor` quand l'interrupteur est actif et peint `activeThumbColor` (sarcelle par
        // defaut), prop que les types natifs ne connaissent pas.
        {...{ activeThumbColor: thumbOnColor }}
        trackColor={{ false: colors.surfaceHigh, true: trackOnColor }}
        value={value}
      />
    </View>
  );
};
