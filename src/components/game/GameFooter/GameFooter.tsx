import { View } from 'react-native';

import { REACTION_EMOJIS } from '@/data';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import ReactionBar from '@/components/game/ReactionBar';

import type { GameFooterProps } from './types';

import { createStyles } from './styles';

/**
 * Footer de manche commun aux jeux (dumb) : le panneau (fond, bord haut, padding) autour de ses `children`,
 * avec le bouton de reactions flottant au-dessus (hors flux) dans une room a plusieurs. Contrepartie de
 * `GameHeader` ; sa place est le `footer` d'un `Screen`, c'est a l'appelant de la choisir.
 */
export const GameFooter = ({ children, onReact }: GameFooterProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <View style={styles.footer}>
      {onReact && (
        <ReactionBar
          emojis={REACTION_EMOJIS}
          labelFor={t.reactions.send}
          onPick={onReact}
          toggleLabel={t.reactions.toggle}
        />
      )}
      {children}
    </View>
  );
};
