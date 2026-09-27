import { View } from 'react-native';

import { DIFFICULTIES, difficultyEmoji } from '@/data';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import Chip from '@/components/ui/Chip';
import Section from '@/components/ui/Section';
import type { DifficultySectionProps } from './types';

import { createStyles } from './styles';

/**
 * Difficulty picker (`DIFFICULTIES`, shared across all 3 games) — dumb: the emoji/label come from
 * `@/data`/`@/i18n`'s `setup.difficulties`, already the same across every game's translations.
 * Only `title`/`hint` are props, since those differ per game's own translation namespace.
 */
export const DifficultySection = ({ title, hint, selected, onSelect, disabled = false }: DifficultySectionProps) => {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const t = useTranslation();

  return (
    <Section hint={hint} title={title}>
      <View style={styles.chips}>
        {DIFFICULTIES.map((difficulty) => (
          <Chip
            key={difficulty.id}
            disabled={disabled}
            emoji={difficultyEmoji(difficulty, isDark)}
            label={t.setup.difficulties[difficulty.id]}
            onPress={() => onSelect(difficulty.id)}
            selected={selected.includes(difficulty.id)}
          />
        ))}
      </View>
    </Section>
  );
};
