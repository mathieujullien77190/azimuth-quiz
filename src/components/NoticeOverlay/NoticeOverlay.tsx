import { Modal, Pressable, Text } from 'react-native';

import { useThemedStyles } from '@/themes';

import type { NoticeOverlayProps } from './types';

import { createStyles } from './styles';

/**
 * Full-screen "the room is gone" splash (host deleted it, you were kicked...) - fixed near-black
 * backdrop rather than a themed one, since it reads the same in both themes and this is exactly
 * the kind of screen where the theme itself might be about to disappear from under it. Tappable:
 * dismisses early instead of only ever waiting out a caller's own auto-dismiss timeout.
 */
export const NoticeOverlay = ({ message, onDismiss }: NoticeOverlayProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal animationType="fade" transparent visible={message !== null}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Text style={styles.text}>{message}</Text>
      </Pressable>
    </Modal>
  );
};
