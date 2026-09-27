import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/data';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import type { FooterNavProps } from './types';

const createStyles = () =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    validateFlex: {
      flex: 1,
    },
  });

/**
 * "Suivant"/"Precedent" (one shown at a time, whichever section was last navigated to) next to
 * "Valider" — shared by `GameScreen` and `OnlineGameScreen`, whose guess phase footers are
 * otherwise identical. Mount with a different `key` each round/player (see both callers): always
 * restarts on "Suivant" with no effect or ref-during-render, just React's usual remount on key
 * change.
 */
export const FooterNav = ({ onGoToCap, onGoToDistance, validateDisabled, onValidate }: FooterNavProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const [onCap, setOnCap] = useState(false);

  return (
    <View style={styles.row}>
      {onCap ? (
        <Button
          label={t.game.previousStep}
          onPress={() => {
            setOnCap(false);
            onGoToDistance();
          }}
          variant="ghost"
        />
      ) : (
        <Button
          label={t.game.nextStep}
          onPress={() => {
            setOnCap(true);
            onGoToCap();
          }}
          variant="ghost"
        />
      )}
      <View style={styles.validateFlex}>
        <Button disabled={validateDisabled} label={t.game.validate} onPress={onValidate} />
      </View>
    </View>
  );
};
