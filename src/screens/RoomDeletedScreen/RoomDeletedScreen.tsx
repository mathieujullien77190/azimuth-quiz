import { useRouter } from 'expo-router';

import { useTranslation } from '@/i18n';

import { RoomDeletedScreenView } from './RoomDeletedScreenView';
import type { RoomDeletedScreenProps } from './types';

/**
 * Notice « l'hote a supprime la room », commune aux ecrans de jeu en ligne. Seul un joiner la voit : l'hote
 * a supprime la room lui-meme et rentre deja a l'accueil dans ce meme tap. Sert aussi, avec son propre `message`,
 * a une connexion perdue (`useRoomPresence`). Cliquable : inutile de faire attendre le joiner.
 */
export const RoomDeletedScreen = ({ message }: RoomDeletedScreenProps) => {
  const router = useRouter();
  const t = useTranslation();

  return (
    <RoomDeletedScreenView
      message={message ?? t.setup.online.roomDeletedNotice}
      onDismiss={() => router.dismissTo('/')}
    />
  );
};
