import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { QuitButton } from './QuitButton';
import { source } from '@/storybook/source';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Common/ui/QuitButton',
  component: QuitButton,
} satisfies Meta<typeof QuitButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: source(defaultCode),
  args: { onPress: fn() },
};
