import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Chip from '@/components/ui/Chip';
import Section from '@/components/ui/Section';
import type { CategorySectionProps } from './types';

import { createStyles } from './styles';

/**
 * Category picker — dumb: the label comes from `@/i18n`'s `setup.categories`, already shared
 * across every game's translations. `categories` (which ids/emoji this game's pool actually
 * offers) and `title`/`hint` (own translation namespace) are the only per-game props.
 */
export const CategorySection = ({ title, hint, categories, selected, onToggle, disabled = false }: CategorySectionProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Section hint={hint} title={title}>
      <View style={styles.chips}>
        {categories.map((category) => (
          <Chip
            key={category.id}
            disabled={disabled}
            emoji={category.emoji}
            label={t.setup.categories[category.id]}
            onPress={() => onToggle(category.id)}
            selected={selected.includes(category.id)}
          />
        ))}
      </View>
    </Section>
  );
};
