import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/themes';

import NoticeOverlay from '@/components/ui/NoticeOverlay';

import { styles } from './RoomDeletedScreenView.styles';
import type { RoomDeletedScreenViewProps } from './types';

/** Pur rendu : la notice plein ecran sur le fond du theme. */
export const RoomDeletedScreenView = ({ message, onDismiss }: RoomDeletedScreenViewProps) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <NoticeOverlay message={message} onDismiss={onDismiss} />
    </SafeAreaView>
  );
};
