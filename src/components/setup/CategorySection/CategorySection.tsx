import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Chip from '@/components/ui/Chip';
import Section from '@/components/ui/Section';
import type { CategorySectionProps } from './types';

import { createStyles } from './styles';

/**
 * Choix des categories (dumb) : les libelles viennent de `setup.categories` (`@/i18n`), communs aux jeux.
 * Seuls `categories` (ids/emojis du pool du jeu) et `title`/`hint` (namespace propre) varient par jeu.
 */
export const CategorySection = ({
  title,
  hint,
  categories,
  selected,
  onToggle,
  disabled = false,
}: CategorySectionProps) => {
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
