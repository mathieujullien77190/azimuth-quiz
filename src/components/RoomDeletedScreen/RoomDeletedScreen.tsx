import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/themes';

import NoticeOverlay from '@/components/NoticeOverlay';
import ThemeBackdrop from '@/components/ThemeBackdrop';

import { styles } from './styles';

/**
 * "The host deleted the room" notice, shared by every online game screen. Only a joiner ever sees
 * this: the host is the one who made the room disappear (see `useOnlineRoomSession`'s
 * `handleQuit`), and it's already navigating itself home in that same tap — showing it this same
 * notice too just traps it behind a modal with nothing to do until the redundant redirect timeout
 * catches up. Also used, with its own `message`, when a connection was lost (`useRoomPresence`).
 * Tappable rather than only ever auto-dismissing: no reason to make a joiner wait it out.
 */
export const RoomDeletedScreen = ({ message }: { message?: string }) => {
  const router = useRouter();
  const t = useTranslation();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ThemeBackdrop />
      <NoticeOverlay message={message ?? t.setup.online.roomDeletedNotice} onDismiss={() => router.dismissTo('/')} />
    </SafeAreaView>
  );
};
