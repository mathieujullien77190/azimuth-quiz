import { View } from 'react-native';

import { REACTION_EMOJIS } from '@/data';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import ReactionBar from '@/components/ReactionBar';

import type { GameFooterProps } from './types';

import { createStyles } from './styles';

/**
 * The in-round footer shared by every game — dumb: just the panel (background, top border, padding)
 * around its `children` (and, in a room with other players, the round emoji-reactions button floating just above it: out of its flow, the footer's own content keeps its whole layout and width), the counterpart of `GameHeader` at the bottom of the screen. Where it sits
 * is the caller's: the `footer` of a `Screen`.
 */
export const GameFooter = ({ children, onReact }: GameFooterProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <View style={styles.footer}>
      {onReact && <ReactionBar
          emojis={REACTION_EMOJIS}
          labelFor={t.reactions.send}
          onPick={onReact}
          toggleLabel={t.reactions.toggle}
        />}
      {children}
    </View>
  );
};
