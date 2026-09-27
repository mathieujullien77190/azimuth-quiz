import { View } from 'react-native';

import { ROUND_OPTIONS } from '@/data';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Chip from '@/components/ui/Chip';
import Section from '@/components/ui/Section';
import type { RoundsSectionProps } from './types';

import { createStyles } from './styles';

/**
 * Round-count picker (`ROUND_OPTIONS`, shared across all 3 games) — dumb: the title is `@/i18n`'s
 * `setup.roundsTitle`, already the same key in all three games' translations, so it's the one
 * piece of text this component doesn't need as a prop.
 */
export const RoundsSection = ({ rounds, onSelect, disabled = false }: RoundsSectionProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Section title={t.setup.roundsTitle}>
      <View style={styles.chips}>
        {ROUND_OPTIONS.map((option) => (
          <Chip
            key={option}
            disabled={disabled}
            label={String(option)}
            onPress={() => onSelect(option)}
            selected={rounds === option}
          />
        ))}
      </View>
    </Section>
  );
};
