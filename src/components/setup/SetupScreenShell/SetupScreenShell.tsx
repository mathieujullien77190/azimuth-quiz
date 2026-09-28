import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import NoticeOverlay from '@/components/NoticeOverlay';
import PartySection from '@/components/setup/PartySection';
import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import type { SetupScreenShellProps } from './types';

import { createStyles } from './styles';

/**
 * Everything every game's setup screen has in common — dumb: notice overlay, the icon + title with a close cross at the far right, the
 * solo/host/join `PartySection`, then the game's own sections as `children`, then "start" (hidden
 * for a joiner, only the host launches) and "back".
 */
export const SetupScreenShell = ({
  title,
  icon,
  party,
  overlayMessage,
  overlayLoading = false,
  onDismissOverlay,
  children,
  startLabel,
  backLabel,
  startDisabled,
  onStartPress,
  onBack,
}: SetupScreenShellProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <>
      <NoticeOverlay loading={overlayLoading} message={overlayMessage} onDismiss={onDismissOverlay} />
      <Screen>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <Pressable
            accessibilityLabel={backLabel}
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={styles.close}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <PartySection {...party} hint={t.setup.playersSection.hint} title={t.setup.playersSection.title} />

        {children}

        {party.onlineChoice !== 'join' && <Button disabled={startDisabled} label={startLabel} onPress={onStartPress} />}
        <Button label={backLabel} onPress={onBack} variant="ghost" />
      </Screen>
    </>
  );
};
