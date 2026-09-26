import type { Meta, StoryObj } from '@storybook/react-vite';

import Chip from './Chip';

const meta = {
  title: 'Common/ui/Chip',
  component: Chip,
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Selected: Story = {
  args: { emoji: '🟢', label: 'Facile', onPress: () => {}, selected: true },
};

export const Unselected: Story = {
  args: { emoji: '🟠', label: 'Moyen', onPress: () => {}, selected: false },
};
