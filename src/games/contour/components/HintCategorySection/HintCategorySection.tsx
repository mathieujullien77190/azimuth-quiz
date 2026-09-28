import { View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Chip from '@/components/ui/Chip';
import Section from '@/components/ui/Section';
import { CONTOUR_HINT_CATEGORIES } from '../../constants';
import type { HintCategorySectionProps } from './types';

import { createStyles } from './styles';

/**
 * Silhouette's hint-category picker (multi-select, like Compass' `CategorySection`): which kinds of
 * hints the rounds use — the outline getting more precise, the neighbors, the cities, the capital.
 * Dumb: the labels come from `@/i18n`, the caller keeps at least one selected.
 */
export const HintCategorySection = ({ selected, onToggle, disabled = false }: HintCategorySectionProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Section hint={t.contourSetup.hintCategoriesHint} title={t.contourSetup.hintCategoriesTitle}>
      <View style={styles.chips}>
        {CONTOUR_HINT_CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            disabled={disabled}
            emoji={category.emoji}
            label={t.contourSetup.hintCategories[category.id]}
            onPress={() => onToggle(category.id)}
            selected={selected.includes(category.id)}
          />
        ))}
      </View>
    </Section>
  );
};
