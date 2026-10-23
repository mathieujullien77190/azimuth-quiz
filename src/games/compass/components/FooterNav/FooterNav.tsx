import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import type { FooterNavProps } from './types';

import { createStyles } from './styles';

/**
 * "Suivant"/"Precedent" a cote de "Valider", partage par `GameScreen` et `OnlineGameScreen`. `onCap` est
 * controle par le parent : il doit aussi suivre un defilement a la main.
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
