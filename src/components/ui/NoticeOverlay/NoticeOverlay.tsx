import { Modal, Pressable, Text } from 'react-native';

import { useThemedStyles } from '@/themes';

import Spinner from '@/components/ui/Spinner';

import { SPINNER_COLOR } from './constants';
import type { NoticeOverlayProps } from './types';

import { createStyles } from './styles';

/**
 * Plein ecran « room disparue » (hote parti, expulsion...). Fond quasi noir fixe plutot que themed : lisible dans
 * les deux themes. Un tap ferme avant le delai. Avec `loading`, un spinner clair tourne au-dessus du message.
 */
export const NoticeOverlay = ({ message, onDismiss, loading = false }: NoticeOverlayProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal animationType="fade" transparent visible={message !== null}>
      <Pressable style={styles.overlay} onPress={loading ? undefined : onDismiss}>
        {loading && <Spinner color={SPINNER_COLOR} size="large" />}
        <Text style={styles.text}>{message}</Text>
      </Pressable>
    </Modal>
  );
};
