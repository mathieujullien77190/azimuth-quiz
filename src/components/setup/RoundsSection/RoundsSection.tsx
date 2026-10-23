import { View } from 'react-native';

import { ROUND_OPTIONS } from '@/data';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Chip from '@/components/ui/Chip';
import Section from '@/components/ui/Section';
import type { RoundsSectionProps } from './types';

import { createStyles } from './styles';

/**
 * Choix du nombre de manches (`ROUND_OPTIONS`, commun aux 3 jeux), dumb : le titre est `setup.roundsTitle`
 * (`@/i18n`), meme cle partout, donc le seul texte qui n'est pas une prop.
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
