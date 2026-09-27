import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import type { FooterNavProps } from './types';

import { createStyles } from './styles';

/**
 * "Suivant"/"Precedent" (one shown at a time, whichever section the round is scrolled to) next
 * to "Valider" — shared by `GameScreen` and `OnlineGameScreen`, whose guess phase footers are
 * otherwise identical. Both halves are exactly 50% of the row's width (`stepFlex`/`validateFlex`
 * are both `flex: 1`). `onCap` is controlled by the parent rather than local state: it must also
 * follow the player manually dragging the scroll, not just a press on this button.
 */
export const FooterNav = ({ onCap, onGoToCap, onGoToDistance, validateDisabled, onValidate }: FooterNavProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <View style={styles.row}>
      <View style={styles.stepFlex}>
        {onCap ? (
          <Button label={t.game.previousStep} onPress={onGoToDistance} variant="ghost" />
        ) : (
          <Button label={t.game.nextStep} onPress={onGoToCap} variant="ghost" />
        )}
      </View>
      <View style={styles.validateFlex}>
        <Button disabled={validateDisabled} label={t.game.validate} onPress={onValidate} />
      </View>
    </View>
  );
};
