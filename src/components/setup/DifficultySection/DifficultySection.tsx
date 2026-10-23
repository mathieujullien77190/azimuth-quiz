import { View } from 'react-native';

import { DIFFICULTIES, difficultyEmoji } from '@/data';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import Chip from '@/components/ui/Chip';
import Section from '@/components/ui/Section';
import type { DifficultySectionProps } from './types';

import { createStyles } from './styles';

/**
 * Choix de la difficulte (`DIFFICULTIES`, commune aux 3 jeux), dumb : emoji et libelle viennent de
 * `setup.difficulties` (`@/data`, `@/i18n`). Seuls `title`/`hint` sont des props (namespace propre a chaque jeu).
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
            selected={difficulty.id === selected}
          />
        ))}
      </View>
    </Section>
  );
};
