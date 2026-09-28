import { Text } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import NoticeOverlay from '@/components/NoticeOverlay';
import PartySection from '@/components/setup/PartySection';
import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import type { SetupScreenShellProps } from './types';

import { createStyles } from './styles';

/**
 * Everything every game's setup screen has in common — dumb: notice overlay, title, the
 * solo/host/join `PartySection`, then the game's own sections as `children`, then "start" (hidden
 * for a joiner, only the host launches) and "back".
 */
export const SetupScreenShell = ({
  title,
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
        <Text style={styles.title}>{title}</Text>

        <PartySection {...party} hint={t.setup.playersSection.hint} title={t.setup.playersSection.title} />

        {children}

        {party.onlineChoice !== 'join' && <Button disabled={startDisabled} label={startLabel} onPress={onStartPress} />}
        <Button label={backLabel} onPress={onBack} variant="ghost" />
      </Screen>
    </>
  );
};
