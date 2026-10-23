import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '~sb/source';

import { HomeScreenView } from '../HomeScreenView';
import loadingCode from './Loading.source.md?raw';
import readyCode from './Ready.source.md?raw';

const meta = {
  title: 'Screens/HomeScreenView',
  component: HomeScreenView,
  args: { onSettings: () => {}, onPlay: () => {}, onJoin: () => {} },
  decorators: [
    (Story) => (
      <div style={{ width: 390, height: 760, position: 'relative', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomeScreenView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** L'app est prete : « Jouer » et « Rejoindre » au pied de la boussole. */
export const Ready: Story = {
  parameters: source(readyCode),
  args: { loading: false },
};

/** Demarrage : la barre de chargement tient la place des boutons. */
export const Loading: Story = {
  parameters: source(loadingCode),
  args: { loading: true },
};
