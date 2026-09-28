import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Button from '@/components/ui/Button';

import { NoticeOverlay } from './NoticeOverlay';
import type { NoticeOverlayProps } from './types';
import { source } from '@/storybook/source';
import defaultCode from './Default.source.md?raw';
import loadingCode from './Loading.source.md?raw';

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below — an inline arrow assigned to a story's `render` doesn't qualify. Mocks the
 * screen `NoticeOverlay` normally sits on top of (a real one would be a game screen), so the 0.8
 * opacity backdrop actually has something behind it to dim. */
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
          args.onDismiss();
          setMessage(null);
        }}
      />
    </View>
  );
};

const meta = {
  title: 'Common/NoticeOverlay',
  component: NoticeOverlay,
} satisfies Meta<typeof NoticeOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Full-screen splash for "the room is gone" cases (host deleted it, you were kicked...) — a
 * fixed near-black backdrop at 0.8 opacity over whatever screen was showing, tap anywhere to
 * dismiss early instead of only ever waiting out the caller's own auto-dismiss timeout. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { message: 'L’hôte a supprimé la partie.', onDismiss: fn() },
  render: InteractiveDemo,
};

/** With `loading`: a light grey spinner turns above the message — a wait ("Préparation de la
 * partie…"), not a dead end. Same splash otherwise. */
export const Loading: Story = {
  parameters: source(loadingCode),
  args: { loading: true, message: 'Préparation de la partie…', onDismiss: fn() },
  render: InteractiveDemo,
};
