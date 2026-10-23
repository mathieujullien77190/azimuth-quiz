import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/themes';

import NoticeOverlay from '@/components/ui/NoticeOverlay';

import { styles } from './styles';

/**
 * Notice « l'hote a supprime la room », commune aux ecrans de jeu en ligne. Seul un joiner la voit : l'hote
 * a supprime la room lui-meme et rentre deja a l'accueil dans ce meme tap. Sert aussi, avec son propre `message`,
 * a une connexion perdue (`useRoomPresence`). Cliquable : inutile de faire attendre le joiner.
 */
export const RoomDeletedScreen = ({ message }: { message?: string }) => {
  const router = useRouter();
  const t = useTranslation();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <NoticeOverlay message={message ?? t.setup.online.roomDeletedNotice} onDismiss={() => router.dismissTo('/')} />
    </SafeAreaView>
  );
};
