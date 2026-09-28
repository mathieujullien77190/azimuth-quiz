import { Modal, Pressable, Text } from 'react-native';

import { useThemedStyles } from '@/themes';

import Spinner from '@/components/ui/Spinner';

import { SPINNER_COLOR } from './constants';
import type { NoticeOverlayProps } from './types';

import { createStyles } from './styles';

/**
 * Full-screen "the room is gone" splash (host deleted it, you were kicked...) - fixed near-black
 * backdrop rather than a themed one, since it reads the same in both themes and this is exactly
 * the kind of screen where the theme itself might be about to disappear from under it. Tappable:
 * dismisses early instead of only ever waiting out a caller's own auto-dismiss timeout. With
 * `loading`, a light spinner turns above the message (a wait, not a dead end).
 */
export const NoticeOverlay = ({ message, onDismiss, loading = false }: NoticeOverlayProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal animationType="fade" transparent visible={message !== null}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        {loading && <Spinner color={SPINNER_COLOR} size="large" />}
        <Text style={styles.text}>{message}</Text>
      </Pressable>
    </Modal>
  );
};
