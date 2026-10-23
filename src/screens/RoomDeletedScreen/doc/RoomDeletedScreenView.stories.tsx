import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '~sb/source';

import { RoomDeletedScreenView } from '../RoomDeletedScreenView';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Screens/RoomDeletedScreenView',
  component: RoomDeletedScreenView,
  args: { onDismiss: () => {} },
  decorators: [
    (Story) => (
      <div style={{ width: 390, height: 500, position: 'relative', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoomDeletedScreenView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Notice plein ecran, cliquable : un tap renvoie a l'accueil. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { message: 'L’hôte a supprimé la partie.' },
};
