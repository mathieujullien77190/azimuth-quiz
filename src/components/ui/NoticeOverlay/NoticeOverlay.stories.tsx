import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Button from '@/components/ui/Button';

import { NoticeOverlay } from './NoticeOverlay';
import type { NoticeOverlayProps } from './types';
import { source } from '~sb/source';
import defaultCode from './doc/Default.source.md?raw';
import loadingCode from './doc/Loading.source.md?raw';

/**
 * Nomme (majuscule) pour que rules-of-hooks d'eslint accepte le `useState`. Simule l'ecran sous l'overlay,
 * sinon le fond a 0.8 d'opacite n'a rien a assombrir.
 */
const InteractiveDemo = (args: NoticeOverlayProps) => {
  const [message, setMessage] = useState(args.message);
  return (
    <View style={{ alignItems: 'center', gap: 16, height: 400, justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 24 }}>Ecran de jeu (derriere la notice)</Text>
      <Button label="Montrer la notice" onPress={() => setMessage(args.message)} />
      <NoticeOverlay
        {...args}
        message={message}
        onDismiss={() => {
          args.onDismiss?.();
          setMessage(null);
        }}
      />
    </View>
  );
};

const meta = {
  title: 'UI/NoticeOverlay',
  component: NoticeOverlay,
} satisfies Meta<typeof NoticeOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Plein ecran « room disparue » : fond quasi noir fixe, un tap ferme avant le delai de l'appelant. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { message: 'L’hôte a supprimé la partie.', onDismiss: fn() },
  render: InteractiveDemo,
};

/** Avec `loading` : un spinner gris clair au-dessus du message (une attente, pas une impasse). */
export const Loading: Story = {
  parameters: source(loadingCode),
  args: { loading: true, message: 'Préparation de la partie…', onDismiss: fn() },
  render: InteractiveDemo,
};
