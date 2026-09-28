import type { Meta, StoryObj } from '@storybook/react-vite';

import Chip from './Chip';
import { source } from '@/storybook/source';
import selectedCode from './Selected.source.md?raw';
import unselectedCode from './Unselected.source.md?raw';

const meta = {
  title: 'Common/ui/Chip',
  component: Chip,
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Selected: Story = {
  parameters: source(selectedCode),
  args: { emoji: '🟢', label: 'Facile', onPress: () => {}, selected: true },
};

export const Unselected: Story = {
  parameters: source(unselectedCode),
  args: { emoji: '🟠', label: 'Moyen', onPress: () => {}, selected: false },
};
